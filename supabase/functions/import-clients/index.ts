import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { clients } = await req.json();
  
  let inserted = 0;
  let errors = 0;
  const batchSize = 50;

  for (let i = 0; i < clients.length; i += batchSize) {
    const batch = clients.slice(i, i + batchSize);
    const { error } = await supabase.from("clients").upsert(batch, { onConflict: "email" });
    if (error) {
      console.error(`Batch ${i / batchSize} error:`, error.message);
      errors++;
    } else {
      inserted += batch.length;
    }
  }

  return new Response(JSON.stringify({ inserted, errors, total: clients.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
