import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Subscription types that grant full magazine access (2 ans)
const FULL_ACCESS_TYPES = [
  "2ans", "abo-2-ans", "Abonnement 2 ans",
  "price_1T11hVKbRd4yKDMHHCpMLRc3",
  "prod_Tyzgq3QeYl52IS",
];

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

    const lowerEmail = email.toLowerCase();
    let hasAccess = false;

    // 1) Check digital_access table (single issue purchases, passes)
    const now = new Date().toISOString();
    const { data: access } = await supabaseAdmin
      .from("digital_access")
      .select("*")
      .eq("email", lowerEmail)
      .gt("expires_at", now)
      .or(`issue_id.eq.${issue_id},access_type.eq.pass_15_days`)
      .limit(1);

    if (access && access.length > 0) {
      hasAccess = true;
    }

    // 2) Check clients table for active 2-year subscribers
    if (!hasAccess) {
      const { data: client } = await supabaseAdmin
        .from("clients")
        .select("subscription_type, subscription_end_date, is_active_subscriber")
        .eq("email", lowerEmail)
        .maybeSingle();

      if (
        client &&
        client.is_active_subscriber &&
        client.subscription_type &&
        FULL_ACCESS_TYPES.includes(client.subscription_type) &&
        client.subscription_end_date &&
        new Date(client.subscription_end_date) > new Date()
      ) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
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

    // Try multiple path variations to find the PDF (same logic as get-preview-url)
    const pdfPath = issue.pdf_url;
    const pathsToTry = [
      pdfPath,
      `${pdfPath}.pdf`,
      `Magazine/${pdfPath}`,
      `Magazine/${pdfPath}.pdf`,
    ];

    let signedData = null;
    for (const path of pathsToTry) {
      const { data, error } = await supabaseAdmin.storage
        .from("magazine-pdfs")
        .createSignedUrl(path, 3600);
      if (!error && data?.signedUrl) {
        signedData = data;
        break;
      }
    }

    if (!signedData?.signedUrl) {
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
