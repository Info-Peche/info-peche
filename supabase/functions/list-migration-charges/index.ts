import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-11-20.acacia' });
    const since = 1778420000;
    const out: any[] = [];
    let starting_after: string | undefined;
    while (true) {
      const page: any = await stripe.invoices.list({
        limit: 100,
        created: { gte: since },
        status: 'paid',
        ...(starting_after ? { starting_after } : {}),
      });
      for (const inv of page.data) {
        if (inv.amount_paid !== 4800) continue;
        let email = inv.customer_email || '';
        let name = inv.customer_name || '';
        if ((!email || !name) && inv.customer) {
          try {
            const c: any = await stripe.customers.retrieve(inv.customer as string);
            email = email || c.email || '';
            name = name || c.name || '';
          } catch {}
        }
        let charge_id = inv.charge as string | null;
        let pi_id = inv.payment_intent as string | null;
        if (!charge_id && pi_id) {
          try {
            const pi: any = await stripe.paymentIntents.retrieve(pi_id);
            charge_id = pi.latest_charge as string;
          } catch {}
        }
        out.push({
          invoice_id: inv.id,
          invoice_number: inv.number,
          customer_id: inv.customer,
          email,
          name,
          amount_eur: (inv.amount_paid / 100).toFixed(2),
          created: new Date(inv.created * 1000).toISOString(),
          charge_id,
          payment_intent_id: pi_id,
          subscription_id: inv.subscription,
          dashboard_url: `https://dashboard.stripe.com/invoices/${inv.id}`,
          refund_url: charge_id ? `https://dashboard.stripe.com/payments/${charge_id}` : '',
        });
      }
      if (!page.has_more) break;
      starting_after = page.data[page.data.length - 1].id;
    }
    return new Response(JSON.stringify({ count: out.length, items: out }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});