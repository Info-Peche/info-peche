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
  console.log(`[CREATE-CHECKOUT] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const { items, customer_info } = await req.json();
    // items: Array<{ price_id: string; quantity: number; mode: "payment" | "subscription" }>
    // customer_info: { email, first_name, last_name, phone, address_line1, address_line2, city, postal_code, country }

    if (!items || items.length === 0) {
      throw new Error("No items provided");
    }
    if (!customer_info?.email) {
      throw new Error("Customer email is required");
    }

    logStep("Request parsed", { itemCount: items.length, email: customer_info.email });

    // Determine mode: if any item is subscription, use subscription mode
    const hasSubscription = items.some((i: any) => i.mode === "subscription");
    const mode = hasSubscription ? "subscription" : "payment";
    logStep("Checkout mode", { mode });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: customer_info.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    const origin = req.headers.get("origin") || "https://info-peche.fr";

    // Build line items
    const lineItems = items.map((item: any) => ({
      price: item.price_id,
      quantity: item.quantity || 1,
    }));

    // Store customer info + items as metadata
    const metadata = {
      first_name: customer_info.first_name,
      last_name: customer_info.last_name,
      phone: customer_info.phone || "",
      address_line1: customer_info.address_line1,
      address_line2: customer_info.address_line2 || "",
      city: customer_info.city,
      postal_code: customer_info.postal_code,
      country: customer_info.country || "FR",
      order_type: mode,
      items_json: JSON.stringify(items),
      comment: customer_info.comment || "",
      billing_different: customer_info.billing_different ? "true" : "false",
      billing_address_line1: customer_info.billing_address_line1 || "",
      billing_address_line2: customer_info.billing_address_line2 || "",
      billing_city: customer_info.billing_city || "",
      billing_postal_code: customer_info.billing_postal_code || "",
      billing_country: customer_info.billing_country || "FR",
    };

    const sessionParams: any = {
      customer: customerId,
      customer_email: customerId ? undefined : customer_info.email,
      line_items: lineItems,
      mode,
      metadata,
      payment_method_types: ["card", "sepa_debit", "paypal"],
      success_url: `${origin}/commande-confirmee?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/boutique`,
      locale: "fr",
      shipping_address_collection: {
        allowed_countries: ["FR", "BE", "CH", "LU", "MC"],
      },
      custom_text: {
        submit: {
          message: "🎣 Rejoignez les 20 000+ lecteurs qui nous font confiance.",
        },
        after_submit: {
          message: "L'équipe Info-Pêche vous souhaite une bonne lecture !",
        },
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Save order to database
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const totalAmount = items.reduce((sum: number, item: any) => {
      return sum + (item.unit_amount || 0) * (item.quantity || 1);
    }, 0);

    const { error: dbError } = await supabaseAdmin.from("orders").insert({
      email: customer_info.email,
      first_name: customer_info.first_name,
      last_name: customer_info.last_name,
      phone: customer_info.phone || null,
      address_line1: customer_info.address_line1,
      address_line2: customer_info.address_line2 || null,
      city: customer_info.city,
      postal_code: customer_info.postal_code,
      country: customer_info.country || "FR",
      order_type: mode,
      payment_method: "stripe",
      is_recurring: hasSubscription,
      items: items,
      total_amount: totalAmount,
      stripe_checkout_session_id: session.id,
      payment_status: "pending",
      status: "pending",
      comment: customer_info.comment || null,
      billing_address_line1: customer_info.billing_different ? customer_info.billing_address_line1 : null,
      billing_address_line2: customer_info.billing_different ? customer_info.billing_address_line2 : null,
      billing_city: customer_info.billing_different ? customer_info.billing_city : null,
      billing_postal_code: customer_info.billing_different ? customer_info.billing_postal_code : null,
      billing_country: customer_info.billing_different ? customer_info.billing_country : null,
      subscription_type: hasSubscription ? items[0]?.price_id : null,
    });

    if (dbError) {
      logStep("DB insert error (non-blocking)", { error: dbError.message });
    } else {
      logStep("Order saved to database");
    }

    return new Response(JSON.stringify({ url: session.url }), {
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
