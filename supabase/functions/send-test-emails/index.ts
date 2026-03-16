import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOGO = "https://www.info-peche.fr/images/info-peche-logo.png";
const RED = "#d41227";
const YELLOW = "#f5c800";
const YELLOW_BG = "#fef9e7";

const header = `
  <div style="background: ${RED}; padding: 20px; text-align: center;">
    <img src="${LOGO}" alt="Info Pêche" style="height: 60px;" />
  </div>`;

const footer = (text: string) => `
  <div style="background: ${RED}; text-align: center; padding: 15px; color: #ffffff; font-size: 12px; font-family: 'Inter', Arial, sans-serif;">
    ${text}
  </div>`;

const sendEmail = async (resendKey: string, from: string, to: string, subject: string, html: string) => {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  return res.json();
};

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not set");

    const TO = "davhuin@gmail.com";
    const NAME = "David Huin";
    const SUB = "Abonnement 2 ans";
    const TOTAL = "100,00€";
    const results: any[] = [];

    const j15 = new Date(); j15.setDate(j15.getDate() + 15);
    const j1 = new Date(); j1.setDate(j1.getDate() + 1);
    const fmt = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

    // EMAIL 1: Confirmation
    const r1 = await sendEmail(resendKey, "Info Pêche <commandes@info-peche.fr>", TO,
      "✅ Confirmation de votre commande Info Pêche",
      `<div style="font-family: 'Playfair Display', Georgia, serif; max-width: 600px; margin: 0 auto; background: #fff;">
        ${header}
        <div style="padding: 30px 25px;">
          <h2 style="color: #1a1a1a; font-family: 'Playfair Display', Georgia, serif;">Merci pour votre commande, ${NAME} !</h2>
          <p style="color: #555; line-height: 1.6; font-family: 'Inter', Arial, sans-serif; font-size: 15px;">
            Votre paiement a été confirmé avec succès. Voici le récapitulatif :
          </p>
          <div style="background: ${YELLOW_BG}; border-left: 4px solid ${YELLOW}; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <p style="font-family: 'Inter', Arial, sans-serif; margin: 0; color: #333; font-size: 14px;">📦 ${SUB} — Info Pêche Magazine</p>
            <hr style="border: none; border-top: 1px solid #e8d98a; margin: 15px 0;">
            <p style="font-size: 18px; font-weight: bold; color: ${RED}; margin: 0;">Total : ${TOTAL}</p>
          </div>
          <div style="margin-top: 20px;">
            <h3 style="color: #1a1a1a; font-family: 'Playfair Display', Georgia, serif;">Adresse de livraison :</h3>
            <p style="color: #555; line-height: 1.6; font-family: 'Inter', Arial, sans-serif; font-size: 14px;">
              12 rue de la Pêche<br>75001 Paris<br>France
            </p>
          </div>
          <div style="background: ${YELLOW_BG}; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center; border: 1px solid ${YELLOW};">
            <h3 style="color: ${RED}; margin: 0 0 10px; font-family: 'Playfair Display', Georgia, serif;">🎣 Accédez à votre espace abonné</h3>
            <p style="color: #555; line-height: 1.6; margin: 0 0 15px; font-family: 'Inter', Arial, sans-serif; font-size: 14px;">
              Votre compte est rattaché à votre adresse email <strong>${TO}</strong>.<br>
              Lors de votre première connexion, cliquez sur <em>« Mot de passe oublié »</em> pour créer votre mot de passe.
            </p>
            <a href="https://www.info-peche.fr/mon-compte" style="display: inline-block; background: ${RED}; color: #fff; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; font-family: 'Inter', Arial, sans-serif;">
              Accéder à mon compte
            </a>
          </div>
          <p style="color: #555; line-height: 1.6; margin-top: 20px; font-family: 'Inter', Arial, sans-serif; font-size: 14px;">
            Votre magazine sera expédié dans les plus brefs délais.
          </p>
        </div>
        ${footer("Info Pêche Magazine — La passion de la pêche au coup")}
      </div>`
    );
    results.push({ email: "confirmation", result: r1 });

    await delay(1200);

    // EMAIL 2: J-15
    const r2 = await sendEmail(resendKey, "Info Pêche <abonnements@info-peche.fr>", TO,
      `📋 Renouvellement dans 15 jours — ${SUB} Info Pêche`,
      `<div style="font-family: 'Playfair Display', Georgia, serif; max-width: 600px; margin: 0 auto; background: #fff;">
        ${header}
        <div style="padding: 30px 25px;">
          <h2 style="color: #1a1a1a; font-family: 'Playfair Display', Georgia, serif;">Bonjour ${NAME},</h2>
          <p style="color: #555; line-height: 1.8; font-size: 16px; font-family: 'Inter', Arial, sans-serif;">
            Votre <strong>${SUB}</strong> sera automatiquement reconduit le <strong>${fmt(j15)}</strong>.
          </p>
          <div style="background: ${YELLOW_BG}; border-left: 4px solid ${YELLOW}; padding: 20px; border-radius: 6px; margin: 25px 0;">
            <p style="margin: 0 0 8px; color: #1a1a1a; font-weight: bold; font-family: 'Inter', Arial, sans-serif;">Récapitulatif :</p>
            <p style="margin: 4px 0; color: #555; font-family: 'Inter', Arial, sans-serif;">📦 Formule : ${SUB}</p>
            <p style="margin: 4px 0; color: #555; font-family: 'Inter', Arial, sans-serif;">💳 Moyen de paiement : carte bancaire</p>
            <p style="margin: 4px 0; color: #555; font-family: 'Inter', Arial, sans-serif;">📅 Date de renouvellement : ${fmt(j15)}</p>
          </div>
          <p style="color: #555; line-height: 1.8; font-size: 15px; font-family: 'Inter', Arial, sans-serif;">
            Le montant sera prélevé automatiquement. Pour modifier ou annuler, contactez-nous à 
            <a href="mailto:contact@info-peche.fr" style="color: ${RED}; font-weight: bold;">contact@info-peche.fr</a>.
          </p>
          <p style="color: #555; line-height: 1.8; font-size: 15px; margin-top: 20px; font-family: 'Inter', Arial, sans-serif;">
            Merci de votre fidélité et bonne pêche ! 🎣
          </p>
        </div>
        ${footer("Info Pêche Magazine — La passion de la pêche au coup")}
      </div>`
    );
    results.push({ email: "j-15", result: r2 });

    await delay(1200);

    // EMAIL 3: J-1
    const r3 = await sendEmail(resendKey, "Info Pêche <abonnements@info-peche.fr>", TO,
      `⏰ Renouvellement demain — Votre ${SUB} Info Pêche`,
      `<div style="font-family: 'Playfair Display', Georgia, serif; max-width: 600px; margin: 0 auto; background: #fff;">
        ${header}
        <div style="padding: 30px 25px;">
          <h2 style="color: #1a1a1a; font-family: 'Playfair Display', Georgia, serif;">Bonjour ${NAME},</h2>
          <p style="color: #555; line-height: 1.8; font-size: 16px; font-family: 'Inter', Arial, sans-serif;">
            Votre <strong>${SUB}</strong> sera automatiquement reconduit le <strong>${fmt(j1)}</strong>, soit demain.
          </p>
          <div style="background: ${YELLOW_BG}; border-left: 4px solid ${YELLOW}; padding: 20px; border-radius: 6px; margin: 25px 0;">
            <p style="margin: 0 0 8px; color: #1a1a1a; font-weight: bold; font-family: 'Inter', Arial, sans-serif;">Récapitulatif :</p>
            <p style="margin: 4px 0; color: #555; font-family: 'Inter', Arial, sans-serif;">📦 Formule : ${SUB}</p>
            <p style="margin: 4px 0; color: #555; font-family: 'Inter', Arial, sans-serif;">💳 Moyen de paiement : carte bancaire</p>
            <p style="margin: 4px 0; color: #555; font-family: 'Inter', Arial, sans-serif;">📅 Date de renouvellement : ${fmt(j1)}</p>
          </div>
          <p style="color: #555; line-height: 1.8; font-size: 15px; font-family: 'Inter', Arial, sans-serif;">
            Le montant sera prélevé automatiquement. Pour modifier ou annuler, contactez-nous à 
            <a href="mailto:contact@info-peche.fr" style="color: ${RED}; font-weight: bold;">contact@info-peche.fr</a>.
          </p>
          <p style="color: #555; line-height: 1.8; font-size: 15px; margin-top: 20px; font-family: 'Inter', Arial, sans-serif;">
            Merci de votre fidélité et bonne pêche ! 🎣
          </p>
        </div>
        ${footer("Info Pêche Magazine — La passion de la pêche au coup")}
      </div>`
    );
    results.push({ email: "j-1", result: r3 });

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
