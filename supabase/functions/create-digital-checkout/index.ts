import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const { email, price_id, issue_id, access_type } = await req.json();
    // access_type: "single_issue" | "pass_15_days"
    // issue_id: required for single_issue, null for pass

    if (!email) throw new Error("Email is required");
    if (!price_id) throw new Error("Price ID is required");

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://info-peche.fr";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [{ price: price_id, quantity: 1 }],
      mode: "payment",
      metadata: {
        access_type: access_type || "single_issue",
        issue_id: issue_id || "",
        email,
      },
      success_url: `${origin}/blog?access=granted&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/blog`,
      locale: "fr",
    });

    // Save digital access record (pending)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const expiresAt = access_type === "pass_15_days"
      ? new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year for single issue

    await supabaseAdmin.from("digital_access").insert({
      email,
      access_type: access_type || "single_issue",
      issue_id: issue_id || null,
      expires_at: expiresAt,
      stripe_checkout_session_id: session.id,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
