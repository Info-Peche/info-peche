import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_OLD = "price_1T11hVKbRd4yKDMHHCpMLRc3";
const DEFAULT_NEW = "price_1TValJKbRd4yKDMHmg0axQkG";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }
    const OLD_PRICE: string = body.from || DEFAULT_OLD;
    const NEW_PRICE: string = body.to || DEFAULT_NEW;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const results: any[] = [];
    let hasMore = true;
    let startingAfter: string | undefined = undefined;
    let total = 0;

    while (hasMore) {
      const page: any = await stripe.subscriptions.list({
        price: OLD_PRICE,
        status: "active",
        limit: 100,
        starting_after: startingAfter,
      });

      for (const sub of page.data) {
        const item = sub.items.data[0];
        if (!item || item.price.id !== OLD_PRICE) continue;
        let attempt = 0;
        while (attempt < 4) {
          try {
            await stripe.subscriptions.update(sub.id, {
              items: [{ id: item.id, price: NEW_PRICE }],
              proration_behavior: "none",
              cancel_at_period_end: false,
            });
            results.push({ id: sub.id, status: "ok" });
            total++;
            break;
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            if (msg.includes("rate limit") && attempt < 3) {
              attempt++;
              await new Promise((r) => setTimeout(r, 800 * attempt));
              continue;
            }
            results.push({ id: sub.id, status: "error", error: msg });
            break;
          }
        }
        await new Promise((r) => setTimeout(r, 120));
      }

      hasMore = page.has_more;
      if (hasMore && page.data.length > 0) {
        startingAfter = page.data[page.data.length - 1].id;
      }
    }

    return new Response(JSON.stringify({ from: OLD_PRICE, to: NEW_PRICE, migrated: total, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});