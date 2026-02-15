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

    const { email, issue_id } = await req.json();
    if (!email || !issue_id) {
      throw new Error("Email and issue_id are required");
    }

    // Check digital access
    const now = new Date().toISOString();
    const { data: access, error: accessError } = await supabaseAdmin
      .from("digital_access")
      .select("*")
      .eq("email", email)
      .gt("expires_at", now)
      .or(`issue_id.eq.${issue_id},access_type.eq.pass_15_days`)
      .limit(1);

    if (accessError) throw accessError;
    if (!access || access.length === 0) {
      return new Response(JSON.stringify({ error: "no_access" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Get the issue's PDF path
    const { data: issue, error: issueError } = await supabaseAdmin
      .from("digital_issues")
      .select("pdf_url")
      .eq("id", issue_id)
      .single();

    if (issueError || !issue?.pdf_url) {
      throw new Error("Issue not found or no PDF available");
    }

    // Generate a signed URL (valid 1 hour)
    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from("magazine-pdfs")
      .createSignedUrl(issue.pdf_url, 3600);

    if (signError || !signedData?.signedUrl) {
      throw new Error("Could not generate signed URL");
    }

    return new Response(JSON.stringify({ url: signedData.signedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const status = msg === "no_access" ? 403 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    });
  }
});
