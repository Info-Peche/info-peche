import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const log = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${d}`);
};

// Map Stripe price/product IDs to renewal item ids + readable labels
const RENEWAL_MAP: Record<string, { id: string; name: string; subType: string }> = {
  // 6 months
  "price_1TVbcZKbRd4yKDMHu80N9Mif": { id: "renewal-6m", name: "Renouvellement abo 6 mois", subType: "abo-6-mois" },
  "price_1T11i1KbRd4yKDMHppfC8rE9": { id: "renewal-6m", name: "Renouvellement abo 6 mois", subType: "abo-6-mois" },
  "prod_Tyzh45p7SqdgGh": { id: "renewal-6m", name: "Renouvellement abo 6 mois", subType: "abo-6-mois" },
  // 1 year
  "price_1T11hkKbRd4yKDMH6WlS54AH": { id: "renewal-1y", name: "Renouvellement abo 1 an", subType: "abo-1-an" },
  "prod_Tyzho0muIqVKsX": { id: "renewal-1y", name: "Renouvellement abo 1 an", subType: "abo-1-an" },
  // 2 years
  "price_1TValJKbRd4yKDMHmg0axQkG": { id: "renewal-2y", name: "Renouvellement abo 2 ans", subType: "abo-2-ans" },
  "price_1T11hVKbRd4yKDMHHCpMLRc3": { id: "renewal-2y", name: "Renouvellement abo 2 ans", subType: "abo-2-ans" },
  "prod_Tyzgq3QeYl52IS": { id: "renewal-2y", name: "Renouvellement abo 2 ans", subType: "abo-2-ans" },
};

function resolveRenewal(priceId: string | null, productId: string | null) {
  if (priceId && RENEWAL_MAP[priceId]) return RENEWAL_MAP[priceId];
  if (productId && RENEWAL_MAP[productId]) return RENEWAL_MAP[productId];
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const sig = req.headers.get("stripe-signature");
    if (!sig) return new Response("Missing signature", { status: 400, headers: corsHeaders });

    const body = await req.text();
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    } catch (err) {
      log("Signature verification failed", { error: String(err) });
      return new Response("Invalid signature", { status: 400, headers: corsHeaders });
    }

    log("Event received", { type: event.type, id: event.id });

    // We only care about successful renewal payments
    if (event.type !== "invoice.payment_succeeded") {
      return new Response(JSON.stringify({ received: true, ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const invoice = event.data.object as Stripe.Invoice;
    const billingReason = invoice.billing_reason;

    // Only renewal cycles — NOT the initial subscription creation (already recorded by checkout flow)
    if (billingReason !== "subscription_cycle") {
      log("Skipped (not a renewal cycle)", { billingReason, invoiceId: invoice.id });
      return new Response(JSON.stringify({ received: true, skipped: billingReason }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscriptionId = typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id ?? null;
    if (!subscriptionId) {
      log("No subscription on invoice", { invoiceId: invoice.id });
      return new Response(JSON.stringify({ received: true, error: "no subscription" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Resolve product / price from invoice line
    const line = invoice.lines.data[0];
    const priceId = line?.price?.id ?? null;
    const productId = typeof line?.price?.product === "string" ? line.price.product : null;
    const renewal = resolveRenewal(priceId, productId);
    if (!renewal) {
      log("Unknown subscription product — skipped", { priceId, productId });
      return new Response(JSON.stringify({ received: true, skipped: "unknown product" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // Idempotency: skip if we already inserted an order for this invoice
    const piId = typeof invoice.payment_intent === "string" ? invoice.payment_intent : null;
    const { data: existing } = await supabase
      .from("orders")
      .select("id")
      .eq("stripe_subscription_id", subscriptionId)
      .eq("order_type", "subscription_renewal")
      .eq("stripe_payment_intent_id", piId ?? "__none__")
      .maybeSingle();
    if (existing) {
      log("Already recorded", { orderId: existing.id, invoiceId: invoice.id });
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Find the original order to copy customer info
    const { data: original } = await supabase
      .from("orders")
      .select("*")
      .eq("stripe_subscription_id", subscriptionId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const customerEmail = original?.email
      ?? invoice.customer_email
      ?? (typeof invoice.customer === "object" ? (invoice.customer as Stripe.Customer)?.email : null)
      ?? "";

    const periodStart = line?.period?.start ? new Date(line.period.start * 1000).toISOString() : null;
    const periodEnd = line?.period?.end ? new Date(line.period.end * 1000).toISOString() : null;
    const amount = invoice.amount_paid ?? 0;

    const item = {
      id: renewal.id,
      name: renewal.name,
      price_id: priceId,
      product_id: productId,
      unit_amount: amount,
      quantity: 1,
    };

    const insertPayload = {
      email: customerEmail.toLowerCase(),
      first_name: original?.first_name ?? "",
      last_name: original?.last_name ?? "",
      phone: original?.phone ?? null,
      address_line1: original?.address_line1 ?? "",
      address_line2: original?.address_line2 ?? null,
      city: original?.city ?? "",
      postal_code: original?.postal_code ?? "",
      country: original?.country ?? "FR",
      billing_first_name: original?.billing_first_name ?? null,
      billing_last_name: original?.billing_last_name ?? null,
      billing_address_line1: original?.billing_address_line1 ?? null,
      billing_address_line2: original?.billing_address_line2 ?? null,
      billing_city: original?.billing_city ?? null,
      billing_postal_code: original?.billing_postal_code ?? null,
      billing_country: original?.billing_country ?? null,
      order_type: "subscription_renewal",
      items: [item],
      total_amount: amount,
      currency: invoice.currency ?? "eur",
      payment_method: "card",
      stripe_subscription_id: subscriptionId,
      stripe_payment_intent_id: piId,
      stripe_checkout_session_id: null,
      payment_status: "paid",
      status: "confirmed",
      is_recurring: true,
      is_processed: false,
      subscriber_number: original?.subscriber_number ?? null,
      subscription_type: renewal.subType,
      subscription_start_date: periodStart,
      subscription_end_date: periodEnd,
      comment: `Renouvellement automatique — Stripe invoice ${invoice.id}`,
    };

    const { data: inserted, error: insertErr } = await supabase
      .from("orders")
      .insert(insertPayload)
      .select("id")
      .single();

    if (insertErr) {
      log("Insert error", { error: insertErr.message });
      return new Response(JSON.stringify({ error: insertErr.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Update client subscription_end_date
    if (customerEmail && periodEnd) {
      await supabase
        .from("clients")
        .update({ subscription_end_date: periodEnd, is_active_subscriber: true })
        .eq("email", customerEmail.toLowerCase());
    }

    log("Renewal order created", { orderId: inserted?.id, email: customerEmail, amount });

    return new Response(JSON.stringify({ received: true, orderId: inserted?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});