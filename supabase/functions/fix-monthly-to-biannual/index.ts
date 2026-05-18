import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'npm:@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Corrige les 3 abonnements 6 mois qui sont à tort sur le price mensuel.
// - Switch item: price mensuel -> price 6 mois (proration_behavior=none)
// - Recale renouvellement: trial_end = sub.created + 6 mois (fallback now+6mo)
// - Met à jour orders.subscription_end_date côté DB
// Body: { dry_run?: boolean }

const BAD_PRICE = 'price_1T11i1KbRd4yKDMHppfC8rE9';   // 14,50 € / mois
const GOOD_PRICE = 'price_1TVbcZKbRd4yKDMHu80N9Mif';  // 14,50 € / 6 mois
const SIX_MONTHS_SEC = 60 * 60 * 24 * 183; // ~6 mois

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-11-20.acacia' });
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    const body = await req.json().catch(() => ({}));
    const { dry_run = true } = body;

    // Find all subscriptions on the bad price (active + trialing)
    const found: any[] = [];
    for (const status of ['active', 'trialing', 'past_due']) {
      const subs = await stripe.subscriptions.list({ price: BAD_PRICE, status: status as any, limit: 100 });
      found.push(...subs.data);
    }

    const now = Math.floor(Date.now() / 1000);
    const results: any[] = [];

    for (const sub of found) {
      const item = sub.items.data.find((i: any) => i.price.id === BAD_PRICE);
      if (!item) continue;

      const customer: any = await stripe.customers.retrieve(sub.customer as string);
      const email = customer.email?.toLowerCase() || null;

      // Target renewal = created + 6 months, fallback to now + 6 months if past
      let target = sub.created + SIX_MONTHS_SEC;
      if (target <= now + 60) target = now + SIX_MONTHS_SEC;
      const targetIso = new Date(target * 1000).toISOString();

      const row: any = {
        email,
        sub_id: sub.id,
        customer_id: sub.customer,
        created: new Date(sub.created * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        new_renewal: targetIso,
      };

      if (dry_run) {
        row.action = 'WOULD_UPDATE';
        results.push(row);
        continue;
      }

      try {
        await stripe.subscriptions.update(sub.id, {
          items: [
            { id: item.id, deleted: true },
            { price: GOOD_PRICE, quantity: 1 },
          ],
          proration_behavior: 'none',
          trial_end: target,
          cancel_at: null,
        });
        row.action = 'STRIPE_UPDATED';
      } catch (e: any) {
        row.action = 'STRIPE_ERROR';
        row.error = e.message;
        results.push(row);
        continue;
      }

      // Update orders.subscription_end_date
      if (email) {
        const { error: dbErr } = await supabase
          .from('orders')
          .update({ subscription_end_date: targetIso })
          .eq('email', email)
          .eq('is_recurring', true)
          .eq('payment_status', 'paid');
        if (dbErr) {
          row.db = 'ERROR: ' + dbErr.message;
        } else {
          row.db = 'UPDATED';
        }
      }

      results.push(row);
    }

    return new Response(JSON.stringify({
      dry_run,
      bad_price: BAD_PRICE,
      good_price: GOOD_PRICE,
      found: found.length,
      results,
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message, stack: e.stack }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});