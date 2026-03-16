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
      { days: 15, label: "J-15" },
      { days: 1, label: "J-1" },
    ];

    let totalSent = 0;

    for (const reminder of reminders) {
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
          <div style="font-family: 'Playfair Display', Georgia, serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: #ffffff; padding: 25px 20px 15px; text-align: center; border-bottom: 3px solid #d41227;">
              <img src="https://www.info-peche.fr/images/info-peche-logo.png" alt="Info Pêche" style="height: 60px;" />
            </div>
            <div style="padding: 30px 25px;">
              <h2 style="color: #1a1a1a; margin: 0 0 15px; font-family: 'Playfair Display', Georgia, serif;">Bonjour ${customerName},</h2>
              <p style="color: #555; line-height: 1.8; font-size: 16px; font-family: 'Inter', Arial, sans-serif;">
                Votre <strong>${subLabel}</strong> sera automatiquement reconduit 
                le <strong>${endDate}</strong>${reminder.days === 1 ? ", soit demain" : ""}.
              </p>
              <div style="background: #fef9e7; border-left: 4px solid #f5c800; padding: 20px; border-radius: 6px; margin: 25px 0;">
                <p style="margin: 0 0 8px; color: #1a1a1a; font-weight: bold; font-family: 'Inter', Arial, sans-serif;">Récapitulatif :</p>
                <p style="margin: 4px 0; color: #555; font-family: 'Inter', Arial, sans-serif;">📦 Formule : ${subLabel}</p>
                <p style="margin: 4px 0; color: #555; font-family: 'Inter', Arial, sans-serif;">💳 Moyen de paiement : ${paymentMethod}</p>
                <p style="margin: 4px 0; color: #555; font-family: 'Inter', Arial, sans-serif;">📅 Date de renouvellement : ${endDate}</p>
              </div>
              <p style="color: #555; line-height: 1.8; font-size: 15px; font-family: 'Inter', Arial, sans-serif;">
                Le montant sera prélevé automatiquement sur votre ${paymentMethod}. 
                Si vous souhaitez modifier ou annuler votre abonnement, contactez-nous 
                avant cette date à <a href="mailto:contact@info-peche.fr" style="color: #d41227; font-weight: bold;">contact@info-peche.fr</a>.
              </p>
              <p style="color: #555; line-height: 1.8; font-size: 15px; margin-top: 20px; font-family: 'Inter', Arial, sans-serif;">
                Merci de votre fidélité et bonne pêche ! 🎣
              </p>
            </div>
            <div style="background: #d41227; text-align: center; padding: 15px; color: #ffffff; font-size: 12px; font-family: 'Inter', Arial, sans-serif;">
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
            from: "Info Pêche <abonnements@info-peche.fr>",
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
