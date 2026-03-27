import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[VERIFY-DIGITAL-PAYMENT] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { session_id } = await req.json();
    if (!session_id) throw new Error("session_id is required");
    logStep("Session ID received", { session_id });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Session retrieved", { status: session.payment_status, email: session.customer_details?.email });

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({
        success: false,
        status: session.payment_status,
        message: "Le paiement n'est pas encore confirmé.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check if access already exists for this session (idempotency)
    const { data: existing } = await supabaseAdmin
      .from("digital_access")
      .select("id")
      .eq("stripe_checkout_session_id", session_id)
      .limit(1);

    if (existing && existing.length > 0) {
      logStep("Access already granted for this session", { id: existing[0].id });
      return new Response(JSON.stringify({ success: true, already_granted: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Extract metadata from session
    const meta = session.metadata || {};
    const email = meta.email || session.customer_details?.email || "";
    const accessType = meta.access_type || "single_issue";
    const issueId = meta.issue_id || null;

    if (!email) throw new Error("No email found in session");

    const expiresAt = accessType === "pass_15_days"
      ? new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const { error: insertError } = await supabaseAdmin.from("digital_access").insert({
      email: email.toLowerCase(),
      access_type: accessType,
      issue_id: issueId || null,
      expires_at: expiresAt,
      stripe_checkout_session_id: session_id,
    });

    if (insertError) {
      logStep("Insert error", { error: insertError.message });
      throw new Error(`Failed to create access: ${insertError.message}`);
    }

    logStep("Digital access granted", { email, accessType, issueId, expiresAt });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
