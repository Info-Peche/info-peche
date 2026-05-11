import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// One-shot helper: repositionne la prochaine facture d'un abonnement Stripe
// à une date cible, sans rien prélever, et retire un éventuel cancel_at.
// Body JSON: { email: string, target_date: "YYYY-MM-DD", dry_run?: boolean }
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-11-20.acacia' });
    const { email, target_date, dry_run } = await req.json();
    if (!email || !target_date) throw new Error('email et target_date (YYYY-MM-DD) requis');

    // Date cible à 12:00 UTC pour éviter tout effet de bord de fuseau
    const target = new Date(`${target_date}T12:00:00Z`);
    const trial_end = Math.floor(target.getTime() / 1000);
    if (trial_end <= Math.floor(Date.now() / 1000)) throw new Error('target_date doit être dans le futur');

    // Trouver le client
    const customers = await stripe.customers.list({ email, limit: 5 });
    if (customers.data.length === 0) throw new Error(`Aucun client Stripe pour ${email}`);
    if (customers.data.length > 1) {
      return new Response(JSON.stringify({
        warning: 'Plusieurs clients Stripe avec cet email',
        customers: customers.data.map(c => ({ id: c.id, created: c.created })),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const customer = customers.data[0];

    // Trouver les subs actives
    const subsActive = await stripe.subscriptions.list({ customer: customer.id, status: 'active', limit: 10 });
    const subsTrialing = await stripe.subscriptions.list({ customer: customer.id, status: 'trialing', limit: 10 });
    const subs = { data: [...subsActive.data, ...subsTrialing.data] };
    if (subs.data.length === 0) throw new Error(`Aucun abonnement actif/trialing pour ${email}`);
    if (subs.data.length > 1) {
      return new Response(JSON.stringify({
        warning: 'Plusieurs subs actives — préciser sub_id',
        subs: subs.data.map(s => ({ id: s.id, current_period_end: s.current_period_end, cancel_at: s.cancel_at })),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const sub = subs.data[0];

    const before = {
      id: sub.id,
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
    };

    if (dry_run) {
      return new Response(JSON.stringify({
        dry_run: true,
        customer: { id: customer.id, email: customer.email },
        before,
        will_set: {
          trial_end: new Date(trial_end * 1000).toISOString(),
          proration_behavior: 'none',
          cancel_at: null,
        },
      }, null, 2), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const updated = await stripe.subscriptions.update(sub.id, {
      trial_end,
      proration_behavior: 'none',
      cancel_at: null,
    });

    return new Response(JSON.stringify({
      ok: true,
      customer: { id: customer.id, email: customer.email },
      before,
      after: {
        id: updated.id,
        current_period_end: new Date(updated.current_period_end * 1000).toISOString(),
        cancel_at: updated.cancel_at ? new Date(updated.cancel_at * 1000).toISOString() : null,
        trial_end: updated.trial_end ? new Date(updated.trial_end * 1000).toISOString() : null,
      },
    }, null, 2), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});