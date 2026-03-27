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

    let targetEmail: string | null = null;

    // Check if this is an admin query (via body) or a user query (via auth token)
    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    if (body.admin_email) {
      // Admin mode: verify admin role first
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
      );
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) throw new Error("Not authenticated");

      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
      if (authError || !user) throw new Error("Not authenticated");

      // Check admin role
      const { data: hasRole } = await supabaseAdmin.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (!hasRole) throw new Error("Not authorized");

      targetEmail = body.admin_email.toLowerCase();
    } else {
      // User mode: get email from auth token
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
      );
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) throw new Error("Not authenticated");

      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
      if (authError || !user?.email) throw new Error("Not authenticated");

      targetEmail = user.email.toLowerCase();
    }

    const now = new Date().toISOString();

    // Get all active digital access entries for this email
    const { data: accessEntries, error } = await supabaseAdmin
      .from("digital_access")
      .select("id, issue_id, access_type, expires_at")
      .eq("email", targetEmail)
      .gt("expires_at", now)
      .not("issue_id", "is", null);

    if (error) throw error;

    // Get issue details for those IDs
    const issueIds = [...new Set((accessEntries || []).map((a: any) => a.issue_id).filter(Boolean))];

    let issues: any[] = [];
    if (issueIds.length > 0) {
      const { data: issueData } = await supabaseAdmin
        .from("digital_issues")
        .select("id, title, issue_number, cover_image")
        .in("id", issueIds)
        .order("issue_number", { ascending: false });
      issues = issueData || [];
    }

    return new Response(JSON.stringify({
      issues,
      issue_ids: issueIds,
      access_entries: accessEntries || [],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: msg === "Not authenticated" ? 401 : 500,
    });
  }
});
