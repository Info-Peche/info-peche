// Safety net: reconcile orders stuck in `pending` whose Stripe payment actually succeeded.
// Runs on a schedule (pg_cron, every 15 minutes). For each pending order created
// between 15 minutes and 7 days ago, asks Stripe for the latest session status.
// - If Stripe says "paid" → calls verify-payment (idempotent) to finalize.
// - If Stripe says "expired" or session is older than 24h → marks order as "expired".

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[RECONCILE-PENDING] ${step}${d}`);
};

const DEFAULT_MIN_AGE_MINUTES = 15;
const DEFAULT_MAX_AGE_DAYS = 7;
const EXPIRE_AFTER_HOURS = 24;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log("Starting reconciliation");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const minAgeIso = new Date(Date.now() - MIN_AGE_MINUTES * 60 * 1000).toISOString();
    const maxAgeIso = new Date(Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { data: pendingOrders, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("id, email, stripe_checkout_session_id, created_at, payment_status")
      .eq("payment_status", "pending")
      .not("stripe_checkout_session_id", "is", null)
      .lte("created_at", minAgeIso)
      .gte("created_at", maxAgeIso);

    if (fetchError) {
      log("Fetch error", { error: fetchError.message });
      throw fetchError;
    }

    log("Pending orders found", { count: pendingOrders?.length || 0 });

    const results = {
      checked: 0,
      reconciled: 0,
      expired: 0,
      still_pending: 0,
      errors: 0,
    };

    for (const order of pendingOrders || []) {
      results.checked++;
      const sessionId = order.stripe_checkout_session_id as string;

      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        log("Stripe session", {
          orderId: order.id,
          email: order.email,
          payment_status: session.payment_status,
          status: session.status,
        });

        if (session.payment_status === "paid") {
          // Call verify-payment (idempotent) to run the same finalization flow.
          const verifyUrl = `${supabaseUrl}/functions/v1/verify-payment`;
          const verifyResp = await fetch(verifyUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({ session_id: sessionId }),
          });
          const verifyJson = await verifyResp.json();
          if (verifyResp.ok && verifyJson?.success) {
            results.reconciled++;
            log("Reconciled", { orderId: order.id, orderNumber: verifyJson.order_number });
          } else {
            results.errors++;
            log("Verify-payment failed", { orderId: order.id, status: verifyResp.status, body: verifyJson });
          }
        } else if (
          session.status === "expired" ||
          (Date.now() - new Date(order.created_at as string).getTime() >
            EXPIRE_AFTER_HOURS * 60 * 60 * 1000)
        ) {
          // Mark as failed (CHECK constraint accepts: pending/paid/failed/refunded)
          // so admin "À traiter" view stays clean.
          const { error: updateError } = await supabaseAdmin
            .from("orders")
            .update({ payment_status: "failed", status: "cancelled" })
            .eq("id", order.id);
          if (updateError) {
            results.errors++;
            log("Expire update error", { orderId: order.id, error: updateError.message });
          } else {
            results.expired++;
            log("Marked failed (expired)", { orderId: order.id });
          }
        } else {
          results.still_pending++;
        }
      } catch (err) {
        results.errors++;
        log("Order processing error", {
          orderId: order.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    log("Reconciliation done", results);

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("FATAL ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
