// Switches existing subscriptions to the Nov 2026 prices.
// Never invoices: proration_behavior none, billing anchor/trial_end unchanged.
import Stripe from "https://esm.sh/stripe@18.5.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const MAP: Record<string, string> = {
  price_1TVbcZKbRd4yKDMHu80N9Mif: "price_1UWy4bKbRd4yKDMHgmcIN06n",
  price_1T11i1KbRd4yKDMHppfC8rE9: "price_1UWy4bKbRd4yKDMHgmcIN06n",
  price_1T11hkKbRd4yKDMH6WlS54AH: "price_1UWy4gKbRd4yKDMHP7r4UPTe",
  price_1TValJKbRd4yKDMHmg0axQkG: "price_1UWy4hKbRd4yKDMHCCGoBQbu",
  price_1T11hVKbRd4yKDMHHCpMLRc3: "price_1UWy4hKbRd4yKDMHCCGoBQbu",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const body = await req.json().catch(() => ({}));
  if (body.secret !== "ip-migrate-2026-11") return new Response("forbidden", { status: 403, headers: corsHeaders });
  const dry = body.dry_run !== false;
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-08-27.basil" });
  const results: unknown[] = [];
  for (const oldPrice of Object.keys(MAP)) {
    for (const status of ["active", "trialing", "past_due"]) {
      for await (const sub of stripe.subscriptions.list({ price: oldPrice, status: status as any, limit: 100 })) {
        const item = sub.items.data.find((i) => i.price.id === oldPrice)!;
        const before = { trial_end: sub.trial_end, period_end: item.current_period_end, cancel_at: sub.cancel_at };
        const row: any = { sub: sub.id, status, old: oldPrice, new: MAP[oldPrice], amount_old: item.price.unit_amount, before };
        if (!dry) {
          const upd = await stripe.subscriptions.update(sub.id, {
            items: [{ id: item.id, price: MAP[oldPrice] }],
            proration_behavior: "none",
            ...(sub.trial_end && sub.status === "trialing" ? { trial_end: sub.trial_end } : {}),
          });
          const it2 = upd.items.data[0];
          row.after = { trial_end: upd.trial_end, period_end: it2.current_period_end, cancel_at: upd.cancel_at, latest_invoice: upd.latest_invoice };
          row.unchanged = row.after.period_end === before.period_end && row.after.trial_end === before.trial_end;
          row.no_new_invoice = upd.latest_invoice === sub.latest_invoice;
        }
        results.push(row);
      }
    }
  }
  return new Response(JSON.stringify({ dry, count: results.length, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
