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

    // Generate a signed URL (valid 30 minutes for preview)
    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from("magazine-pdfs")
      .createSignedUrl(issue.pdf_url, 1800);

    if (signError || !signedData?.signedUrl) {
      throw new Error("Could not generate signed URL");
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
