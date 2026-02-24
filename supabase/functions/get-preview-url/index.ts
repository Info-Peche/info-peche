import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { issue_id } = await req.json();
    if (!issue_id) {
      throw new Error("issue_id is required");
    }

    // Get the issue's PDF path and preview_pages
    const { data: issue, error: issueError } = await supabaseAdmin
      .from("digital_issues")
      .select("pdf_url, preview_pages, title, issue_number, price_cents")
      .eq("id", issue_id)
      .single();

    if (issueError || !issue?.pdf_url) {
      throw new Error("Issue not found or no PDF available");
    }

    // Try multiple path variations to find the PDF
    const pdfPath = issue.pdf_url;
    const pathsToTry = [
      pdfPath,
      `${pdfPath}.pdf`,
      `Magazine/${pdfPath}`,
      `Magazine/${pdfPath}.pdf`,
    ];

    let signedData = null;
    let lastError = null;

    for (const path of pathsToTry) {
      const { data, error } = await supabaseAdmin.storage
        .from("magazine-pdfs")
        .createSignedUrl(path, 1800);
      if (!error && data?.signedUrl) {
        signedData = data;
        break;
      }
      lastError = error;
    }

    if (!signedData?.signedUrl) {
      // List files in Magazine/ folder to help debug
      const { data: rootFiles } = await supabaseAdmin.storage.from("magazine-pdfs").list("", { limit: 50 });
      const { data: magFiles } = await supabaseAdmin.storage.from("magazine-pdfs").list("Magazine", { limit: 50 });
      throw new Error(`Could not find PDF "${pdfPath}". Root: ${JSON.stringify(rootFiles?.map(f => f.name))}. Magazine/: ${JSON.stringify(magFiles?.map(f => f.name))}`);
    }

    return new Response(
      JSON.stringify({
        url: signedData.signedUrl,
        preview_pages: issue.preview_pages || 4,
        title: issue.title,
        issue_number: issue.issue_number,
        price_cents: issue.price_cents,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
