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

const ADMIN_EMAIL = "jeanfrancois.darnet@info-peche.fr";

const SUBSCRIPTION_LABELS: Record<string, string> = {
  "price_1T11hVKbRd4yKDMHHCpMLRc3": "Abonnement 2 ans",
  "price_1T11hkKbRd4yKDMH6WlS54AH": "Abonnement 1 an",
  "price_1T11i1KbRd4yKDMHppfC8rE9": "Abonnement 6 mois",
};

// Enrich line item name with issue number if applicable
const enrichItemName = (productName: string, items: any[]): string => {
  const lower = productName.toLowerCase();
  // Skip subscriptions — they contain "numéros" but shouldn't get issue numbers
  if (lower.includes("abonnement")) return productName;
  // Check if this is an "ancien numéro" or single issue purchase
  if (lower.includes("ancien num") || lower.includes("numéro")) {
    for (const item of items) {
      const issueNum = item.issue_number || item.name?.match(/N°?\s*(\d+)/)?.[1] || "";
      if (issueNum) {
        if (!productName.includes(`N°${issueNum}`) && !productName.includes(`(N°${issueNum})`)) {
          return `${productName} (N°${issueNum})`;
        }
      }
    }
  }
  return productName;
};

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

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["line_items", "line_items.data.price.product"],
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

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get next order number
    const { data: orderNumData } = await supabaseAdmin.rpc("nextval_order_number" as any);
    const orderNumber = orderNumData || 1;
    logStep("Order number assigned", { orderNumber });

    // Parse cart items from metadata for enrichment
    const meta = session.metadata || {};
    const cartItems = meta.items_json ? JSON.parse(meta.items_json) : [];

    // Build update payload
    const updatePayload: Record<string, any> = {
      payment_status: "paid",
      status: "confirmed",
      stripe_payment_intent_id: session.payment_intent as string || null,
      order_number: orderNumber,
    };

    if (session.subscription) {
      updatePayload.stripe_subscription_id = typeof session.subscription === "string"
        ? session.subscription
        : session.subscription.id;
    }

    if (session.mode === "subscription" && session.subscription) {
      try {
        const subId = typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;

        const sub = await stripe.subscriptions.retrieve(subId);
        logStep("Subscription retrieved", { subId, start: sub.current_period_start, end: sub.current_period_end });

        if (sub.current_period_start && typeof sub.current_period_start === "number") {
          updatePayload.subscription_start_date = new Date(sub.current_period_start * 1000).toISOString();
        }
        if (sub.current_period_end && typeof sub.current_period_end === "number") {
          updatePayload.subscription_end_date = new Date(sub.current_period_end * 1000).toISOString();
        }
        updatePayload.is_recurring = true;

        if (sub.default_payment_method && typeof sub.default_payment_method !== "string") {
          const pmType = sub.default_payment_method.type;
          const methodMap: Record<string, string> = { card: "card", sepa_debit: "sepa_debit", paypal: "paypal" };
          updatePayload.payment_method = methodMap[pmType] || "card";
        }

        logStep("Subscription dates set", {
          start: updatePayload.subscription_start_date,
          end: updatePayload.subscription_end_date,
        });
      } catch (subError) {
        logStep("Subscription retrieval error (non-blocking)", {
          message: subError instanceof Error ? subError.message : String(subError),
        });
      }
    }

    // Try to update existing order
    const { data: orderData, error: updateError } = await supabaseAdmin
      .from("orders")
      .update(updatePayload)
      .eq("stripe_checkout_session_id", session_id)
      .select();

    let order = orderData && orderData.length > 0 ? orderData[0] : null;

    if (!order) {
      logStep("No existing order found, creating from session metadata");
      const hasSubscription = session.mode === "subscription";

      const { data: newOrder, error: insertError } = await supabaseAdmin
        .from("orders")
        .insert({
          email: session.customer_details?.email || meta.email || "",
          first_name: meta.first_name || session.customer_details?.name?.split(" ")[0] || "N/A",
          last_name: meta.last_name || session.customer_details?.name?.split(" ").slice(1).join(" ") || "N/A",
          phone: meta.phone || null,
          address_line1: meta.address_line1 || session.shipping_details?.address?.line1 || "N/A",
          address_line2: meta.address_line2 || session.shipping_details?.address?.line2 || null,
          city: meta.city || session.shipping_details?.address?.city || "N/A",
          postal_code: meta.postal_code || session.shipping_details?.address?.postal_code || "N/A",
          country: meta.country || session.shipping_details?.address?.country || "FR",
          order_type: hasSubscription ? "subscription_paper" : "single_issue",
          payment_method: "card",
          is_recurring: hasSubscription,
          items: cartItems,
          total_amount: session.amount_total || 0,
          stripe_checkout_session_id: session_id,
          payment_status: "paid",
          status: "confirmed",
          stripe_payment_intent_id: session.payment_intent as string || null,
          stripe_subscription_id: updatePayload.stripe_subscription_id || null,
          comment: meta.comment || null,
          subscription_start_date: updatePayload.subscription_start_date || null,
          subscription_end_date: updatePayload.subscription_end_date || null,
          subscription_type: hasSubscription ? cartItems[0]?.price_id : null,
          billing_address_line1: meta.billing_different === "true" ? meta.billing_address_line1 : null,
          billing_address_line2: meta.billing_different === "true" ? meta.billing_address_line2 : null,
          billing_city: meta.billing_different === "true" ? meta.billing_city : null,
          billing_postal_code: meta.billing_different === "true" ? meta.billing_postal_code : null,
          billing_country: meta.billing_different === "true" ? meta.billing_country : null,
          order_number: orderNumber,
        })
        .select()
        .single();

      if (insertError) {
        logStep("DB insert error in verify-payment", { error: insertError.message });
      } else {
        order = newOrder;
        logStep("Order created from verify-payment", { orderId: order?.id });
      }
    } else {
      logStep("Order updated", { orderId: order?.id });
    }

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

    // Upsert client into CRM + assign subscriber number if subscription
    let subscriberNumber: string | null = null;
    if (order) {
      try {
        const isSubscription = session.mode === "subscription";

        // If subscription, get next subscriber number
        if (isSubscription) {
          const { data: subNumData } = await supabaseAdmin.rpc("nextval_subscriber_number" as any);
          subscriberNumber = `ABONNE_${subNumData || 1}`;
          logStep("Subscriber number assigned", { subscriberNumber });
        }

        await supabaseAdmin.rpc("upsert_client" as any, {
          _email: order.email,
          _first_name: order.first_name || null,
          _last_name: order.last_name || null,
          _phone: order.phone || null,
          _address_line1: order.address_line1 || null,
          _address_line2: order.address_line2 || null,
          _city: order.city || null,
          _postal_code: order.postal_code || null,
          _country: order.country || "FR",
          _subscription_type: isSubscription ? order.subscription_type : null,
          _subscription_start_date: order.subscription_start_date || null,
          _subscription_end_date: order.subscription_end_date || null,
          _is_active_subscriber: isSubscription,
          _order_total: session.amount_total || 0,
        });

        // Update subscriber_number on client if subscription
        if (isSubscription && subscriberNumber) {
          await supabaseAdmin
            .from("clients")
            .update({ subscriber_number: subscriberNumber } as any)
            .eq("email", order.email.toLowerCase())
            .is("subscriber_number", null); // Only set if not already set
          logStep("Client subscriber_number set", { subscriberNumber });
        }

        logStep("CRM client upserted", { email: order.email });
      } catch (crmErr) {
        logStep("CRM upsert error (non-blocking)", { error: crmErr instanceof Error ? crmErr.message : String(crmErr) });
      }
    }

    const customerEmail = session.customer_details?.email || order?.email;
    const customerName = `${order?.first_name || ""} ${order?.last_name || ""}`.trim();
    const orderNumDisplay = `#${orderNumber}`;

    // Build line items summary with enriched names
    const lineItemsSummary = session.line_items?.data.map((li: any) => {
      let productName = li.price?.product?.name || li.description || "Produit";
      productName = enrichItemName(productName, cartItems);
      return `• ${productName} × ${li.quantity} — ${(li.amount_total / 100).toFixed(2)}€`;
    }).join("\n") || "Détails non disponibles";

    const totalFormatted = session.amount_total ? `${(session.amount_total / 100).toFixed(2)}€` : "N/A";

    // Send emails via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey && customerEmail) {
      const isSubscription = session.mode === "subscription";
      
      // 1. Email to customer
      const customerEmailResult = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Info Pêche <commandes@info-peche.fr>",
          to: [customerEmail],
          subject: `✅ Confirmation de votre commande ${orderNumDisplay} — Info Pêche`,
          html: `
            <div style="font-family: 'Playfair Display', Georgia, serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
              <div style="background: #ffffff; padding: 25px 20px 15px; text-align: center; border-bottom: 3px solid #d41227;">
                <img src="https://www.info-peche.fr/images/info-peche-logo.png" alt="Info Pêche" style="height: 60px;" />
              </div>
              <div style="padding: 30px 25px;">
                <h2 style="color: #1a1a1a; margin: 0 0 15px; font-family: 'Playfair Display', Georgia, serif;">Merci pour votre commande, ${customerName} !</h2>
                <p style="color: #555; line-height: 1.6; font-family: 'Inter', Arial, sans-serif; font-size: 15px;">
                  Votre paiement a été confirmé avec succès. Voici le récapitulatif de votre commande <strong>${orderNumDisplay}</strong> :
                </p>
                <div style="background: #fef9e7; border-left: 4px solid #f5c800; padding: 20px; border-radius: 6px; margin: 20px 0;">
                  <pre style="font-family: 'Inter', Arial, sans-serif; white-space: pre-wrap; margin: 0; color: #333; font-size: 14px;">${lineItemsSummary}</pre>
                  <hr style="border: none; border-top: 1px solid #e8d98a; margin: 15px 0;">
                  <p style="font-size: 18px; font-weight: bold; color: #d41227; margin: 0;">Total : ${totalFormatted}</p>
                </div>
                ${order ? `
                <div style="margin-top: 20px;">
                  <h3 style="color: #1a1a1a; font-family: 'Playfair Display', Georgia, serif;">Adresse de livraison :</h3>
                  <p style="color: #555; line-height: 1.6; font-family: 'Inter', Arial, sans-serif; font-size: 14px;">
                    ${order.address_line1}<br>
                    ${order.address_line2 ? order.address_line2 + "<br>" : ""}
                    ${order.postal_code} ${order.city}<br>
                    ${order.country}
                  </p>
                </div>
                ` : ""}
                ${isSubscription ? `
                <div style="background: #fef9e7; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center; border: 1px solid #f5c800;">
                  <h3 style="color: #d41227; margin: 0 0 10px; font-family: 'Playfair Display', Georgia, serif;">🎣 Accédez à votre espace abonné</h3>
                  <p style="color: #555; line-height: 1.6; margin: 0 0 15px; font-family: 'Inter', Arial, sans-serif; font-size: 14px;">
                    Votre numéro d'abonné : <strong>${subscriberNumber || "—"}</strong><br>
                    Votre compte est rattaché à votre adresse email <strong>${customerEmail}</strong>.<br>
                    Lors de votre première connexion, cliquez sur <em>« Mot de passe oublié »</em> pour créer votre mot de passe et finaliser vos accès.
                  </p>
                  <a href="https://www.info-peche.fr/mon-compte" style="display: inline-block; background: #d41227; color: #fff; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; font-family: 'Inter', Arial, sans-serif;">
                    Accéder à mon compte
                  </a>
                </div>
                ` : ""}
                <p style="color: #555; line-height: 1.6; margin-top: 20px; font-family: 'Inter', Arial, sans-serif; font-size: 14px;">
                  Votre magazine sera expédié dans les plus brefs délais. 
                  Pour toute question, n'hésitez pas à nous contacter.
                </p>
              </div>
              <div style="background: #d41227; text-align: center; padding: 15px; color: #ffffff; font-size: 12px; font-family: 'Inter', Arial, sans-serif;">
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
          from: "Info Pêche <commandes@info-peche.fr>",
          to: [ADMIN_EMAIL],
          subject: `🎣 Commande ${orderNumDisplay} — ${customerName} — ${totalFormatted}`,
          html: `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
              <div style="background: #ffffff; padding: 20px 15px 12px; text-align: center; border-bottom: 3px solid #d41227;">
                <img src="https://www.info-peche.fr/images/info-peche-logo.png" alt="Info Pêche" style="height: 50px;" />
              </div>
              <div style="padding: 25px;">
                <h2 style="color: #d41227; font-family: 'Playfair Display', Georgia, serif;">Commande ${orderNumDisplay}</h2>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Client</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${customerName}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${customerEmail}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Téléphone</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${order?.phone || "Non renseigné"}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Type</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${isSubscription ? "Abonnement" : "Achat unique"}</td></tr>
                  ${subscriberNumber ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">N° abonné</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${subscriberNumber}</td></tr>` : ""}
                  <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Total</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-size: 18px; color: #d41227; font-weight: bold;">${totalFormatted}</td></tr>
                </table>
                <h3>Articles :</h3>
                <pre style="background: #fef9e7; padding: 15px; border-radius: 5px; white-space: pre-wrap; border-left: 4px solid #f5c800;">${lineItemsSummary}</pre>
                ${order ? `
                <h3>Adresse de livraison :</h3>
                <p>
                  ${order.address_line1}<br>
                  ${order.address_line2 ? order.address_line2 + "<br>" : ""}
                  ${order.postal_code} ${order.city}<br>
                  ${order.country}
                </p>
                ` : ""}
                <p style="margin-top: 20px; padding: 10px; background: #fef9e7; border-radius: 5px; color: #d41227; border-left: 4px solid #f5c800;">
                  💳 Paiement confirmé via Stripe — Session: ${session_id}
                </p>
              </div>
              <div style="background: #d41227; text-align: center; padding: 12px; color: #ffffff; font-size: 12px;">
                Info Pêche Magazine — Administration
              </div>
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
      order_number: orderNumber,
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
