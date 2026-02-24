import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[VERIFY-PAYMENT] ${step}${d}`);
};

const ADMIN_EMAIL = "jeanfrancois.darnet@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { session_id } = await req.json();
    if (!session_id) throw new Error("session_id is required");
    logStep("Session ID received", { session_id });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the checkout session with line items
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["line_items", "line_items.data.price.product", "subscription"],
    });
    logStep("Session retrieved", { status: session.payment_status, email: session.customer_details?.email });

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({
        success: false,
        status: session.payment_status,
        message: "Le paiement n'est pas encore confirmé.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Update order in database
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Build update payload
    const updatePayload: Record<string, any> = {
      payment_status: "paid",
      status: "confirmed",
      stripe_payment_intent_id: session.payment_intent as string || null,
      stripe_subscription_id: session.subscription
        ? (typeof session.subscription === "string" ? session.subscription : session.subscription.id)
        : null,
    };

    // If this is a subscription, extract dates and payment method from Stripe
    if (session.mode === "subscription" && session.subscription) {
      const sub = typeof session.subscription === "string"
        ? await stripe.subscriptions.retrieve(session.subscription)
        : session.subscription;

      const startDate = new Date(sub.current_period_start * 1000).toISOString();
      const endDate = new Date(sub.current_period_end * 1000).toISOString();
      updatePayload.subscription_start_date = startDate;
      updatePayload.subscription_end_date = endDate;
      updatePayload.is_recurring = true;

      // Detect payment method type
      const pmTypes = sub.default_payment_method
        ? typeof sub.default_payment_method === "string"
          ? null
          : sub.default_payment_method.type
        : null;
      if (pmTypes) {
        const methodMap: Record<string, string> = {
          card: "card",
          sepa_debit: "sepa_debit",
          paypal: "paypal",
        };
        updatePayload.payment_method = methodMap[pmTypes] || pmTypes;
      }

      logStep("Subscription dates set", { startDate, endDate });
    }

    const { data: orderData, error: updateError } = await supabaseAdmin
      .from("orders")
      .update(updatePayload)
      .eq("stripe_checkout_session_id", session_id)
      .select()
      .single();

    if (updateError) {
      logStep("DB update error", { error: updateError.message });
    } else {
      logStep("Order updated", { orderId: orderData?.id });

      // Decrement physical stock for paper magazine purchases
      if (order?.items && Array.isArray(order.items)) {
        for (const item of order.items as any[]) {
          const itemId = item.id || "";
          if (typeof itemId === "string" && itemId.startsWith("physical-")) {
            const issueId = itemId.replace("physical-", "");
            const { error: stockError } = await supabaseAdmin.rpc("decrement_stock" as any, {
              _issue_id: issueId,
            });
            if (stockError) {
              logStep("Stock decrement error", { issueId, error: stockError.message });
            } else {
              logStep("Stock decremented", { issueId });
            }
          }
        }
      }
    }

    const order = orderData;
    const customerEmail = session.customer_details?.email || order?.email;
    const customerName = `${order?.first_name || ""} ${order?.last_name || ""}`.trim();

    // Build line items summary
    const lineItemsSummary = session.line_items?.data.map((li: any) => {
      const productName = li.price?.product?.name || li.description || "Produit";
      return `• ${productName} × ${li.quantity} — ${(li.amount_total / 100).toFixed(2)}€`;
    }).join("\n") || "Détails non disponibles";

    const totalFormatted = session.amount_total ? `${(session.amount_total / 100).toFixed(2)}€` : "N/A";

    // Send emails via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey && customerEmail) {
      // 1. Email to customer
      const customerEmailResult = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Info Pêche <onboarding@resend.dev>",
          to: [customerEmail],
          subject: "✅ Confirmation de votre commande Info Pêche",
          html: `
            <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #1a5c2e;">
                <h1 style="color: #1a5c2e; margin: 0;">Info Pêche</h1>
              </div>
              <div style="padding: 30px 0;">
                <h2 style="color: #333;">Merci pour votre commande, ${customerName} !</h2>
                <p style="color: #666; line-height: 1.6;">
                  Votre paiement a été confirmé avec succès. Voici le récapitulatif de votre commande :
                </p>
                <div style="background: #f8f6f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <pre style="font-family: Georgia, serif; white-space: pre-wrap; margin: 0; color: #333;">${lineItemsSummary}</pre>
                  <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
                  <p style="font-size: 18px; font-weight: bold; color: #1a5c2e; margin: 0;">Total : ${totalFormatted}</p>
                </div>
                ${order ? `
                <div style="margin-top: 20px;">
                  <h3 style="color: #333;">Adresse de livraison :</h3>
                  <p style="color: #666; line-height: 1.6;">
                    ${order.address_line1}<br>
                    ${order.address_line2 ? order.address_line2 + "<br>" : ""}
                    ${order.postal_code} ${order.city}<br>
                    ${order.country}
                  </p>
                </div>
                ` : ""}
                <p style="color: #666; line-height: 1.6; margin-top: 20px;">
                  Votre magazine sera expédié dans les plus brefs délais. 
                  Pour toute question, n'hésitez pas à nous contacter.
                </p>
              </div>
              <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #999; font-size: 12px;">
                Info Pêche Magazine — La passion de la pêche au coup
              </div>
            </div>
          `,
        }),
      });
      const customerResult = await customerEmailResult.json();
      logStep("Customer email sent", { result: customerResult });

      // 2. Email to admin
      const adminEmailResult = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Info Pêche <onboarding@resend.dev>",
          to: [ADMIN_EMAIL],
          subject: `🎣 Nouvelle commande — ${customerName} — ${totalFormatted}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1a5c2e;">Nouvelle commande reçue !</h2>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Client</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${customerName}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${customerEmail}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Téléphone</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${order?.phone || "Non renseigné"}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Type</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${order?.order_type === "subscription" ? "Abonnement" : "Achat unique"}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Total</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-size: 18px; color: #1a5c2e; font-weight: bold;">${totalFormatted}</td></tr>
              </table>
              <h3>Articles :</h3>
              <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${lineItemsSummary}</pre>
              ${order ? `
              <h3>Adresse de livraison :</h3>
              <p>
                ${order.address_line1}<br>
                ${order.address_line2 ? order.address_line2 + "<br>" : ""}
                ${order.postal_code} ${order.city}<br>
                ${order.country}
              </p>
              ` : ""}
              <p style="margin-top: 20px; padding: 10px; background: #e8f5e9; border-radius: 5px; color: #2e7d32;">
                💳 Paiement confirmé via Stripe — Session: ${session_id}
              </p>
            </div>
          `,
        }),
      });
      const adminResult = await adminEmailResult.json();
      logStep("Admin email sent", { result: adminResult });
    } else {
      logStep("Email skipped", { hasResendKey: !!resendKey, hasEmail: !!customerEmail });
    }

    return new Response(JSON.stringify({
      success: true,
      status: "paid",
      customer_name: customerName,
      customer_email: customerEmail,
      total: totalFormatted,
      order_type: order?.order_type || session.mode,
      line_items: session.line_items?.data.map((li: any) => ({
        name: li.price?.product?.name || li.description,
        quantity: li.quantity,
        amount: (li.amount_total / 100).toFixed(2),
      })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
