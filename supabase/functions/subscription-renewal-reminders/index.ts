import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[RENEWAL-REMINDERS] ${step}${d}`);
};

const SUBSCRIPTION_LABELS: Record<string, string> = {
  "price_1T11hVKbRd4yKDMHHCpMLRc3": "Abonnement 2 ans",
  "price_1T11hkKbRd4yKDMH6WlS54AH": "Abonnement 1 an",
  "price_1T11i1KbRd4yKDMHppfC8rE9": "Abonnement 6 mois",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not set");

    const now = new Date();
    const reminders = [
      { days: 30, label: "J-30" },
      { days: 15, label: "J-15" },
      { days: 1, label: "J-1" },
    ];

    let totalSent = 0;

    for (const reminder of reminders) {
      // Target date = today + N days (match orders expiring on that day)
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + reminder.days);
      const targetStart = new Date(targetDate);
      targetStart.setHours(0, 0, 0, 0);
      const targetEnd = new Date(targetDate);
      targetEnd.setHours(23, 59, 59, 999);

      logStep(`Checking ${reminder.label}`, {
        from: targetStart.toISOString(),
        to: targetEnd.toISOString(),
      });

      // Find subscription orders expiring on the target date
      const { data: orders, error } = await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("payment_status", "paid")
        .eq("is_recurring", true)
        .gte("subscription_end_date", targetStart.toISOString())
        .lte("subscription_end_date", targetEnd.toISOString());

      if (error) {
        logStep(`DB error for ${reminder.label}`, { error: error.message });
        continue;
      }

      if (!orders || orders.length === 0) {
        logStep(`No orders for ${reminder.label}`);
        continue;
      }

      logStep(`Found ${orders.length} orders for ${reminder.label}`);

      for (const order of orders) {
        const customerName = `${order.first_name} ${order.last_name}`.trim();
        const subLabel = SUBSCRIPTION_LABELS[order.subscription_type || ""] || "Abonnement";
        const endDate = new Date(order.subscription_end_date!).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const paymentMethod = order.payment_method === "card" ? "carte bancaire"
          : order.payment_method === "sepa_debit" ? "prélèvement SEPA"
          : "PayPal";

        const subject = reminder.days === 1
          ? `⏰ Renouvellement demain — Votre ${subLabel} Info Pêche`
          : `📋 Renouvellement dans ${reminder.days} jours — ${subLabel} Info Pêche`;

        const emailHtml = `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #1a5c2e;">
              <h1 style="color: #1a5c2e; margin: 0;">Info Pêche</h1>
            </div>
            <div style="padding: 30px 0;">
              <h2 style="color: #333;">Bonjour ${customerName},</h2>
              <p style="color: #666; line-height: 1.8; font-size: 16px;">
                Votre <strong>${subLabel}</strong> sera automatiquement renouvelé 
                le <strong>${endDate}</strong>${reminder.days === 1 ? ", soit demain" : ""}.
              </p>
              <div style="background: #f8f6f0; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <p style="margin: 0 0 8px; color: #333; font-weight: bold;">Récapitulatif :</p>
                <p style="margin: 4px 0; color: #666;">📦 Formule : ${subLabel}</p>
                <p style="margin: 4px 0; color: #666;">💳 Moyen de paiement : ${paymentMethod}</p>
                <p style="margin: 4px 0; color: #666;">📅 Date de renouvellement : ${endDate}</p>
              </div>
              <p style="color: #666; line-height: 1.8; font-size: 16px;">
                Le montant sera prélevé automatiquement sur votre ${paymentMethod}. 
                Si vous souhaitez modifier ou annuler votre abonnement, contactez-nous 
                avant cette date à <a href="mailto:contact@info-peche.fr" style="color: #1a5c2e;">contact@info-peche.fr</a>.
              </p>
              <p style="color: #666; line-height: 1.8; font-size: 16px; margin-top: 20px;">
                Merci de votre fidélité et bonne pêche ! 🎣
              </p>
            </div>
            <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #999; font-size: 12px;">
              Info Pêche Magazine — La passion de la pêche au coup
            </div>
          </div>
        `;

        const emailResult = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Info Pêche <onboarding@resend.dev>",
            to: [order.email],
            subject,
            html: emailHtml,
          }),
        });

        const result = await emailResult.json();
        logStep(`Email sent (${reminder.label})`, {
          to: order.email,
          result,
        });
        totalSent++;
      }
    }

    logStep("Function completed", { totalSent });

    return new Response(JSON.stringify({ success: true, emails_sent: totalSent }), {
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
