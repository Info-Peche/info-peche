import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'npm:@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Bulk repositionne le renouvellement Stripe à first_invoice_date + 2 ans,
// et met à jour orders.subscription_end_date en miroir.
// Body: { emails: string[], dry_run?: boolean, exclude_emails?: string[] }
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-11-20.acacia' });
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    const { emails, dry_run = true, exclude_emails = [] } = await req.json();
    if (!Array.isArray(emails) || emails.length === 0) throw new Error('emails[] requis');

    const exclude = new Set(exclude_emails.map((e: string) => e.toLowerCase().trim()));
    const targets = emails
      .map((e: string) => e.toLowerCase().trim())
      .filter((e: string) => e && !exclude.has(e));
    // Dédoublonner
    const unique = Array.from(new Set(targets));

    const results: any[] = [];
    const nowSec = Math.floor(Date.now() / 1000);

    for (const email of unique) {
      try {
        // Stripe email filter is case-sensitive — try lowercase + a few variants
        const tried = new Set<string>();
        const customersMap = new Map<string, Stripe.Customer>();
        const variants = [email, email.toLowerCase(), email.charAt(0).toUpperCase() + email.slice(1)];
        for (const v of variants) {
          if (tried.has(v)) continue;
          tried.add(v);
          const r = await stripe.customers.list({ email: v, limit: 5 });
          for (const c of r.data) customersMap.set(c.id, c);
        }
        // Also do a search across all variants (case-insensitive)
        if (customersMap.size === 0) {
          try {
            const s = await stripe.customers.search({ query: `email:"${email}"`, limit: 5 });
            for (const c of s.data) customersMap.set(c.id, c);
          } catch (_e) {}
        }
        const customers = { data: Array.from(customersMap.values()) };
        if (customers.data.length === 0) {
          results.push({ email, status: 'skip', reason: 'no_stripe_customer' });
          continue;
        }

        // Concaténer subs sur tous les customers (cas doublons)
        const allSubs: Stripe.Subscription[] = [];
        const allInvoices: Stripe.Invoice[] = [];
        for (const c of customers.data) {
          const a = await stripe.subscriptions.list({ customer: c.id, status: 'active', limit: 10 });
          const t = await stripe.subscriptions.list({ customer: c.id, status: 'trialing', limit: 10 });
          allSubs.push(...a.data, ...t.data);
          const inv = await stripe.invoices.list({ customer: c.id, limit: 100 });
          allInvoices.push(...inv.data);
        }

        if (allSubs.length === 0) {
          results.push({ email, status: 'skip', reason: 'no_active_or_trialing_sub' });
          continue;
        }
        if (allSubs.length > 1) {
          results.push({
            email, status: 'manual',
            reason: 'multiple_subs',
            subs: allSubs.map(s => ({ id: s.id, status: s.status, cpe: new Date(s.current_period_end * 1000).toISOString() })),
          });
          continue;
        }
        const sub = allSubs[0];

        // Identifier la 1re facture subscription_create payée pour CETTE sub
        const subInvoices = allInvoices
          .filter(i => i.subscription === sub.id && i.billing_reason === 'subscription_create' && (i.status === 'paid' || i.amount_paid > 0))
          .sort((a, b) => a.created - b.created);

        if (subInvoices.length === 0) {
          results.push({ email, status: 'manual', reason: 'no_subscription_create_invoice', sub_id: sub.id });
          continue;
        }

        const firstInvoice = subInvoices[0];
        const firstDate = new Date(firstInvoice.created * 1000);

        // target = first + 2 ans, midi UTC pour stabilité
        const target = new Date(Date.UTC(
          firstDate.getUTCFullYear() + 2,
          firstDate.getUTCMonth(),
          firstDate.getUTCDate(),
          12, 0, 0
        ));
        const trial_end = Math.floor(target.getTime() / 1000);

        if (trial_end <= nowSec) {
          results.push({ email, status: 'skip', reason: 'target_in_past', target: target.toISOString() });
          continue;
        }

        const before = {
          sub_id: sub.id,
          status: sub.status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
        };

        // Récup orders.subscription_end_date courante
        const { data: ord } = await supabase
          .from('orders')
          .select('id, subscription_end_date')
          .eq('email', email)
          .eq('is_recurring', true)
          .eq('payment_status', 'paid')
          .order('created_at', { ascending: false });

        const orderIds = (ord || []).map((o: any) => o.id);
        const currentDbDate = ord && ord[0]?.subscription_end_date || null;

        // Si déjà calé (à 1 jour près), skip
        const diffDays = Math.abs(sub.current_period_end - trial_end) / 86400;
        if (diffDays < 1.5) {
          results.push({
            email, status: 'skip', reason: 'already_aligned',
            first_invoice: firstDate.toISOString(),
            target: target.toISOString(),
            before,
          });
          continue;
        }

        if (dry_run) {
          results.push({
            email, status: 'would_update',
            first_invoice: firstDate.toISOString(),
            target: target.toISOString(),
            before,
            db_orders_count: orderIds.length,
            db_current_end: currentDbDate,
          });
          continue;
        }

        // EXEC
        const updated = await stripe.subscriptions.update(sub.id, {
          trial_end,
          proration_behavior: 'none',
          cancel_at: null,
        });

        let dbUpdated = 0;
        if (orderIds.length > 0) {
          const { error: updErr, count } = await supabase
            .from('orders')
            .update({ subscription_end_date: target.toISOString() }, { count: 'exact' })
            .in('id', orderIds);
          if (updErr) throw new Error(`db_update_failed: ${updErr.message}`);
          dbUpdated = count || 0;
        }

        results.push({
          email, status: 'updated',
          first_invoice: firstDate.toISOString(),
          target: target.toISOString(),
          before,
          after: {
            current_period_end: new Date(updated.current_period_end * 1000).toISOString(),
            trial_end: updated.trial_end ? new Date(updated.trial_end * 1000).toISOString() : null,
          },
          db_orders_updated: dbUpdated,
        });
      } catch (e: any) {
        results.push({ email, status: 'error', error: e.message });
      }
    }

    const summary = {
      total: unique.length,
      updated: results.filter(r => r.status === 'updated').length,
      would_update: results.filter(r => r.status === 'would_update').length,
      skip: results.filter(r => r.status === 'skip').length,
      manual: results.filter(r => r.status === 'manual').length,
      error: results.filter(r => r.status === 'error').length,
    };

    return new Response(JSON.stringify({ dry_run, summary, results }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});