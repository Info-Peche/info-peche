import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHEET_ID = '15biczhHx-BgtnT8g2XbhKHwxTQr7_mDifyzH5BcauXo';
const GATEWAY_URL = 'https://connector-gateway.lovable.dev/google_sheets/v4';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const writeMode = url.searchParams.get('write') === '1';

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-11-20.acacia' });
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
    const SHEETS_KEY = Deno.env.get('GOOGLE_SHEETS_API_KEY')!;
    const sheetHeaders = {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'X-Connection-Api-Key': SHEETS_KEY,
      'Content-Type': 'application/json',
    };

    const readRes = await fetch(`${GATEWAY_URL}/spreadsheets/${SHEET_ID}/values/Sheet1`, { headers: sheetHeaders });
    const sheet = await readRes.json();
    const rows: string[][] = sheet.values || [];
    const header = rows[0];
    const col = (k: string) => header.findIndex(h => h.toLowerCase().includes(k));
    const cInv = col('invoice_id');
    const cCust = col('customer_id');
    const cEmail = col('email');
    const cName = col('name');
    const cPI = col('payment_intent');
    let cStatus = col('rembours');
    if (cStatus < 0) cStatus = header.length;

    const colLetter = (n: number) => {
      let s = ''; n = n + 1;
      while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
      return s;
    };
    const statusLetter = colLetter(cStatus);

    // 1) Build per-customer summary
    const byCust = new Map<string, { email: string; name: string; rows: number[] }>();
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const cust = r[cCust];
      if (!cust) continue;
      if (!byCust.has(cust)) byCust.set(cust, { email: r[cEmail] || '', name: r[cName] || '', rows: [] });
      byCust.get(cust)!.rows.push(i + 1);
    }

    // 2) For each customer, fetch active subs
    const multiSubCustomers: any[] = [];
    for (const [custId, info] of byCust) {
      try {
        const subs = await stripe.subscriptions.list({ customer: custId, status: 'active', limit: 10 });
        if (subs.data.length > 1) {
          multiSubCustomers.push({
            customer_id: custId,
            email: info.email,
            name: info.name,
            sheet_rows: info.rows,
            active_subs: subs.data.map(s => ({
              id: s.id,
              created: new Date(s.created * 1000).toISOString(),
              current_period_end: new Date(s.current_period_end * 1000).toISOString(),
            })),
          });
        }
      } catch {}
    }

    // 3) For each row, fetch invoice billing_reason to detect "création légitime"
    const legitimateCreations: any[] = [];
    const updates: { range: string; values: string[][] }[] = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const invId = r[cInv];
      if (!invId) continue;
      const current = r[cStatus] || '';
      if (current.toLowerCase().includes('ok') || current.toLowerCase().includes('legit') || current.toLowerCase().includes('skip')) continue;
      try {
        const inv: any = await stripe.invoices.retrieve(invId);
        if (inv.billing_reason === 'subscription_create') {
          legitimateCreations.push({
            row: i + 1,
            invoice_id: invId,
            customer_id: r[cCust],
            email: r[cEmail],
            name: r[cName],
            created: new Date(inv.created * 1000).toISOString(),
          });
          if (writeMode) {
            updates.push({
              range: `Sheet1!${statusLetter}${i + 1}`,
              values: [['LEGIT_CREATION - ne pas rembourser']],
            });
          }
        }
      } catch (e: any) {
        // ignore
      }
    }

    if (writeMode && updates.length > 0) {
      await fetch(`${GATEWAY_URL}/spreadsheets/${SHEET_ID}/values:batchUpdate`, {
        method: 'POST',
        headers: sheetHeaders,
        body: JSON.stringify({ valueInputOption: 'USER_ENTERED', data: updates }),
      });
    }

    return new Response(JSON.stringify({
      total_rows: rows.length - 1,
      multi_sub_customers_count: multiSubCustomers.length,
      multi_sub_customers: multiSubCustomers,
      legitimate_creations_count: legitimateCreations.length,
      legitimate_creations: legitimateCreations,
      sheet_updated: writeMode ? updates.length : 0,
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});