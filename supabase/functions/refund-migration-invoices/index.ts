import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Migration window — invoices created here were caused by the 2y price change.
// Started ~17:53 UTC on 2026-05-10, with a buffer.
const WINDOW_START = 1778432800;
const WINDOW_END = 1778436000;
const TARGET_PRODUCT = "prod_Tyzgq3QeYl52IS"; // Abo 2 ans
const NEW_PRICE = "price_1TValJKbRd4yKDMHmg0axQkG";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    let body: any = {};
    try { body = await req.json(); } catch {}
    const dryRun: boolean = body.dryRun === true;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const refunded: any[] = [];
    const voided: any[] = [];
    const skipped: any[] = [];
    const errors: any[] = [];

    let hasMore = true;
    let startingAfter: string | undefined = undefined;
    let scanned = 0;

    while (hasMore) {
      const page: any = await stripe.invoices.list({
        created: { gte: WINDOW_START, lte: WINDOW_END },
        limit: 100,
        starting_after: startingAfter,
      });

      for (const inv of page.data) {
        scanned++;
        // Filter: subscription invoice of exactly 48€ EUR (the 2y migration amount).
        // We rely on amount + subscription presence to be robust to API line shape changes.
        if (inv.currency !== "eur" || inv.total !== 4800 || !inv.subscription) {
          skipped.push({ id: inv.id, reason: "not 48€ subscription", total: inv.total });
          continue;
        }

        try {
          if (inv.status === "paid" && inv.charge) {
            if (!dryRun) {
              const refund = await stripe.refunds.create({
                charge: inv.charge as string,
                reason: "duplicate",
              });
              refunded.push({ invoice: inv.id, charge: inv.charge, refund: refund.id, amount: inv.total });
            } else {
              refunded.push({ invoice: inv.id, charge: inv.charge, amount: inv.total, dryRun: true });
            }
          } else if (inv.status === "open") {
            if (!dryRun) {
              await stripe.invoices.voidInvoice(inv.id);
              voided.push({ invoice: inv.id, amount: inv.total });
            } else {
              voided.push({ invoice: inv.id, amount: inv.total, dryRun: true });
            }
          } else if (inv.status === "draft") {
            if (!dryRun) {
              await stripe.invoices.del(inv.id);
              voided.push({ invoice: inv.id, status: "draft-deleted" });
            } else {
              voided.push({ invoice: inv.id, status: "draft", dryRun: true });
            }
          } else {
            skipped.push({ id: inv.id, reason: `status=${inv.status}` });
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          errors.push({ invoice: inv.id, error: msg });
        }
        await new Promise((r) => setTimeout(r, 80));
      }

      hasMore = page.has_more;
      if (hasMore && page.data.length > 0) {
        startingAfter = page.data[page.data.length - 1].id;
      }
    }

    return new Response(
      JSON.stringify({
        dryRun,
        scanned,
        refunded_count: refunded.length,
        voided_count: voided.length,
        skipped_count: skipped.length,
        errors_count: errors.length,
        refunded,
        voided,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});