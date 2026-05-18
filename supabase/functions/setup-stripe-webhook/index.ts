import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;
  const url = "https://fokaikipfikcokjwyeka.supabase.co/functions/v1/stripe-webhook";

  // Check if endpoint already exists
  const list = await fetch("https://api.stripe.com/v1/webhook_endpoints?limit=100", {
    headers: { Authorization: `Bearer ${stripeKey}` },
  }).then((r) => r.json());

  const existing = list.data?.find((e: any) => e.url === url);
  if (existing) {
    return new Response(
      JSON.stringify({
        status: "already_exists",
        id: existing.id,
        message: "Endpoint déjà créé. Le secret n'est consultable qu'à la création. Supprime-le dans Stripe puis relance cette fonction si tu as besoin d'un nouveau secret.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const body = new URLSearchParams();
  body.append("url", url);
  body.append("enabled_events[]", "invoice.payment_succeeded");
  body.append("description", "Renouvellements abonnements Info Pêche");

  const res = await fetch("https://api.stripe.com/v1/webhook_endpoints", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});