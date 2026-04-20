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

    const { items, customer_info, shipping_cents } = await req.json();

    if (!items || items.length === 0) {
      throw new Error("No items provided");
    }
    if (!customer_info?.email) {
      throw new Error("Customer email is required");
    }

    logStep("Request parsed", { itemCount: items.length, email: customer_info.email, shipping_cents });

    // Determine mode: if any item is subscription, use subscription mode
    const hasSubscription = items.some((i: any) => i.mode === "subscription");
    const mode = hasSubscription ? "subscription" : "payment";
    logStep("Checkout mode", { mode });

    // Detect if order contains only digital items (no shipping needed)
    const isDigitalOnly = items.every((i: any) => typeof i.id === "string" && i.id.startsWith("digital-"));
    logStep("Order type", { isDigitalOnly });

    // Build full name + address payload from the form
    const fullName = `${customer_info.first_name || ""} ${customer_info.last_name || ""}`.trim();
    const shippingPayload = {
      name: fullName,
      phone: customer_info.phone || undefined,
      address: {
        line1: customer_info.address_line1 || "",
        line2: customer_info.address_line2 || undefined,
        city: customer_info.city || "",
        postal_code: customer_info.postal_code || "",
        country: customer_info.country || "FR",
      },
    };

    // Check for existing Stripe customer; create or update so address is pre-filled in Checkout
    const customers = await stripe.customers.list({ email: customer_info.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      // Update existing customer with latest address from our form
      try {
        await stripe.customers.update(customerId, {
          name: fullName || undefined,
          phone: customer_info.phone || undefined,
          address: isDigitalOnly ? undefined : shippingPayload.address,
          shipping: isDigitalOnly ? undefined : shippingPayload,
        });
        logStep("Existing customer updated with address", { customerId });
      } catch (e) {
        logStep("Customer update failed (non-blocking)", { error: (e as Error).message });
      }
    } else {
      // Pre-create customer so Stripe Checkout shows pre-filled address (no double entry)
      const created = await stripe.customers.create({
        email: customer_info.email,
        name: fullName || undefined,
        phone: customer_info.phone || undefined,
        address: isDigitalOnly ? undefined : shippingPayload.address,
        shipping: isDigitalOnly ? undefined : shippingPayload,
      });
      customerId = created.id;
      logStep("New customer created with address", { customerId });
    }

    const origin = req.headers.get("origin") || "https://www.info-peche.fr";

    // Build line items
    const lineItems: any[] = items.map((item: any) => ({
      price: item.price_id,
      quantity: item.quantity || 1,
    }));

    // Add shipping as a line item if applicable
    const shippingAmount = shipping_cents || 0;
    if (shippingAmount > 0) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: "Frais de livraison",
            description: `Envoi postal — ${customer_info.country === "FR" ? "France" : "International"}`,
          },
          unit_amount: shippingAmount,
        },
        quantity: 1,
      });
      logStep("Shipping added", { shippingAmount, country: customer_info.country });
    }

    // Store customer info + items as metadata (Stripe limits each value to 500 chars)
    // Compress items to only essential fields to stay within limits
    const compactItems = items.map((i: any) => ({
      id: i.id,
      n: i.issue_number || "",
      p: i.price_id,
      q: i.quantity || 1,
      m: i.mode,
      a: i.unit_amount || 0,
    }));
    const itemsStr = JSON.stringify(compactItems);
    
    // If still too long, split across multiple metadata keys
    const itemsChunks: Record<string, string> = {};
    if (itemsStr.length <= 500) {
      itemsChunks.items_json = itemsStr;
    } else {
      for (let i = 0; i < itemsStr.length; i += 500) {
        itemsChunks[`items_json_${Math.floor(i / 500)}`] = itemsStr.slice(i, i + 500);
      }
    }

    const metadata: Record<string, string> = {
      first_name: customer_info.first_name,
      last_name: customer_info.last_name,
      phone: customer_info.phone || "",
      address_line1: customer_info.address_line1,
      address_line2: (customer_info.address_line2 || "").slice(0, 500),
      city: customer_info.city,
      postal_code: customer_info.postal_code,
      country: customer_info.country || "FR",
      order_type: mode,
      ...itemsChunks,
      comment: (customer_info.comment || "").slice(0, 500),
      billing_different: customer_info.billing_different ? "true" : "false",
      billing_first_name: customer_info.billing_first_name || "",
      billing_last_name: customer_info.billing_last_name || "",
      billing_address_line1: customer_info.billing_address_line1 || "",
      billing_address_line2: customer_info.billing_address_line2 || "",
      billing_city: customer_info.billing_city || "",
      billing_postal_code: customer_info.billing_postal_code || "",
      billing_country: customer_info.billing_country || "FR",
      shipping_cents: String(shippingAmount),
    };

    const paymentDescription = `Commande de ${customer_info.first_name} ${customer_info.last_name} - ${customer_info.email}`;

    const sessionParams: any = {
      customer: customerId,
      // Do NOT set customer_email when `customer` is provided
      line_items: lineItems,
      mode,
      metadata,
      payment_method_types: ["card", "sepa_debit", "paypal"],
      success_url: `${origin}/commande-confirmee?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/boutique`,
      locale: "fr",
      // Required when reusing an existing customer alongside shipping/billing collection:
      // tells Stripe to sync any edits the customer makes in Checkout back to the customer object.
      customer_update: {
        name: "auto",
        address: "auto",
        shipping: "auto",
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

    // Only collect shipping in Stripe for physical orders.
    // The customer's shipping address is already pre-filled from the form (see customer create/update above),
    // so the user just confirms — no double entry.
    if (!isDigitalOnly) {
      sessionParams.shipping_address_collection = {
        allowed_countries: [
          // France & voisins francophones
          "FR", "BE", "CH", "LU", "MC",
          // Europe
          "DE", "IT", "ES", "PT", "NL", "GB", "IE", "AT", "DK", "SE", "FI", "NO",
          "PL", "CZ", "GR", "HU", "RO", "BG", "HR", "SI", "SK", "EE", "LV", "LT",
          "IS", "MT", "CY",
          // Amérique du Nord
          "US", "CA",
          // Maghreb / Afrique francophone
          "MA", "TN", "DZ", "SN", "CI", "CM", "GA", "BF", "BJ", "ML", "TG", "MG",
          // DOM-TOM
          "RE", "GP", "MQ", "GF", "YT", "PF", "NC",
        ],
      };
    }

    // Add description based on mode
    if (mode === "payment") {
      sessionParams.payment_intent_data = { description: paymentDescription };
    } else {
      sessionParams.subscription_data = { description: paymentDescription };
    }

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
    }, 0) + shippingAmount;

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
      order_type: hasSubscription ? "subscription_paper" : "single_issue",
      payment_method: "card",
      is_recurring: hasSubscription,
      items: items,
      total_amount: totalAmount,
      stripe_checkout_session_id: session.id,
      payment_status: "pending",
      status: "pending",
      comment: customer_info.comment || null,
      billing_first_name: customer_info.billing_different ? customer_info.billing_first_name : null,
      billing_last_name: customer_info.billing_different ? customer_info.billing_last_name : null,
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
