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
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-11-20.acacia' });
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
    const SHEETS_KEY = Deno.env.get('GOOGLE_SHEETS_API_KEY')!;
    const sheetHeaders = {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'X-Connection-Api-Key': SHEETS_KEY,
      'Content-Type': 'application/json',
    };

    // Read sheet to find header row + charge_id col + Remboursé col
    const readRes = await fetch(`${GATEWAY_URL}/spreadsheets/${SHEET_ID}/values/Sheet1`, { headers: sheetHeaders });
    const sheet = await readRes.json();
    const rows: string[][] = sheet.values || [];
    if (rows.length < 2) throw new Error('Sheet vide');
    const header = rows[0];
    const chargeCol = header.findIndex(h => h.toLowerCase().includes('charge_id'));
    const piCol = header.findIndex(h => h.toLowerCase().includes('payment_intent'));
    let statusCol = header.findIndex(h => h.toLowerCase().includes('rembours'));
    if (chargeCol < 0 && piCol < 0) throw new Error('Pas de colonne charge_id/payment_intent_id');
    if (statusCol < 0) statusCol = header.length;

    const colLetter = (n: number) => {
      let s = ''; n = n + 1;
      while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
      return s;
    };
    const statusColLetter = colLetter(statusCol);

    const results: any[] = [];
    const updates: { range: string; values: string[][] }[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const current = row[statusCol] || '';
      if (current.toLowerCase().includes('ok') || current.toLowerCase().includes('remboursé')) {
        results.push({ row: i + 1, skipped: true });
        continue;
      }
      const chargeId = (chargeCol >= 0 ? row[chargeCol] : '') || '';
      const piId = (piCol >= 0 ? row[piCol] : '') || '';
      try {
        const refund = await stripe.refunds.create({
          ...(chargeId ? { charge: chargeId } : { payment_intent: piId }),
          reason: 'duplicate',
          metadata: { migration_2y: 'true' },
        });
        const cell = `Sheet1!${statusColLetter}${i + 1}`;
        const status = `OK ${refund.id}`;
        updates.push({ range: cell, values: [[status]] });
        results.push({ row: i + 1, refund_id: refund.id, status: refund.status });
      } catch (e: any) {
        const cell = `Sheet1!${statusColLetter}${i + 1}`;
        updates.push({ range: cell, values: [[`ERREUR: ${e.message}`]] });
        results.push({ row: i + 1, error: e.message });
      }
    }

    // Ensure header has the column name
    if (statusCol === header.length) {
      await fetch(`${GATEWAY_URL}/spreadsheets/${SHEET_ID}/values/Sheet1!${statusColLetter}1?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: sheetHeaders,
        body: JSON.stringify({ values: [['Remboursé ?']] }),
      });
    }

    // Batch update sheet
    if (updates.length > 0) {
      await fetch(`${GATEWAY_URL}/spreadsheets/${SHEET_ID}/values:batchUpdate`, {
        method: 'POST',
        headers: sheetHeaders,
        body: JSON.stringify({ valueInputOption: 'USER_ENTERED', data: updates }),
      });
    }

    const ok = results.filter(r => r.refund_id).length;
    const ko = results.filter(r => r.error).length;
    const skip = results.filter(r => r.skipped).length;
    return new Response(JSON.stringify({ ok, ko, skipped: skip, results }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});