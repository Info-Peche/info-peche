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

    // Verify admin role
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

    const { action, email, issue_id, access_id } = await req.json();

    if (action === "add") {
      if (!email || !issue_id) throw new Error("email and issue_id required");

      // Check if access already exists
      const { data: existing } = await supabaseAdmin
        .from("digital_access")
        .select("id")
        .eq("email", email.toLowerCase())
        .eq("issue_id", issue_id)
        .limit(1);

      if (existing && existing.length > 0) {
        return new Response(JSON.stringify({ success: true, message: "Access already exists" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const { error: insertError } = await supabaseAdmin.from("digital_access").insert({
        email: email.toLowerCase(),
        access_type: "single_issue",
        issue_id,
        expires_at: expiresAt,
      });

      if (insertError) throw insertError;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (action === "remove") {
      if (!access_id) throw new Error("access_id required");

      const { error: deleteError } = await supabaseAdmin
        .from("digital_access")
        .delete()
        .eq("id", access_id);

      if (deleteError) throw deleteError;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      throw new Error("Invalid action. Use 'add' or 'remove'.");
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: msg.includes("Not auth") ? 401 : 500,
    });
  }
});
