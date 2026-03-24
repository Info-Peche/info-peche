import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map subscription_type from clients table to Stripe product IDs
const SUBSCRIPTION_TYPE_TO_PRODUCT: Record<string, string> = {
  "2ans": "prod_Tyzgq3QeYl52IS",
  "1an": "prod_Tyzho0muIqVKsX",
  "6mois": "prod_Tyzh45p7SqdgGh",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    const userEmail = user.email.toLowerCase();

    // 1) Try Stripe first
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (stripeKey) {
      try {
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
        const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
        
        if (customers.data.length > 0) {
          const customerId = customers.data[0].id;
          const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: "active",
            limit: 1,
          });

          if (subscriptions.data.length > 0) {
            const sub = subscriptions.data[0];
            const productId = sub.items.data[0].price.product;
            let subscriptionEnd: string | null = null;
            try {
              const endVal = sub.current_period_end;
              if (typeof endVal === 'number') {
                subscriptionEnd = new Date(endVal * 1000).toISOString();
              } else if (typeof endVal === 'string') {
                subscriptionEnd = new Date(endVal).toISOString();
              } else if (endVal && typeof endVal === 'object' && 'toISOString' in endVal) {
                subscriptionEnd = (endVal as Date).toISOString();
              }
            } catch (e) {
              console.log("Could not parse current_period_end:", sub.current_period_end, e);
            }

            return new Response(JSON.stringify({
              subscribed: true,
              product_id: productId,
              subscription_end: subscriptionEnd,
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      } catch (stripeErr) {
        console.error("Stripe check failed, falling back to CRM:", stripeErr);
      }
    }

    // 2) Fallback: check clients table in CRM
    const { data: client } = await supabaseAdmin
      .from("clients")
      .select("subscription_type, subscription_end_date, is_active_subscriber")
      .eq("email", userEmail)
      .maybeSingle();

    if (client && client.is_active_subscriber && client.subscription_type) {
      const productId = SUBSCRIPTION_TYPE_TO_PRODUCT[client.subscription_type];
      if (productId) {
        return new Response(JSON.stringify({
          subscribed: true,
          product_id: productId,
          subscription_end: client.subscription_end_date || null,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // No subscription found
    return new Response(JSON.stringify({ subscribed: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});