import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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
    const { email } = await req.json();
    if (!email) throw new Error("email is required");

    console.log("[SEND-SIGNUP-EMAIL] Sending welcome email to", email);

    // Upsert into CRM clients table (just email, no order details yet)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Insert client if not exists (signup only, no order)
    const { error: upsertError } = await supabaseAdmin
      .from("clients")
      .upsert(
        { email: email.toLowerCase() },
        { onConflict: "email", ignoreDuplicates: true }
      );

    if (upsertError) {
      console.log("[SEND-SIGNUP-EMAIL] CRM upsert error (non-blocking)", upsertError.message);
    } else {
      console.log("[SEND-SIGNUP-EMAIL] Client added/exists in CRM");
    }

    // Send branded welcome email via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not configured");

    const result = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Info Pêche <jeanfrancois.darnet@info-peche.fr>",
        to: [email],
        subject: "🎣 Bienvenue sur Info Pêche — Votre compte est créé !",
        html: `
          <div style="font-family: 'Playfair Display', Georgia, serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: #ffffff; padding: 25px 20px 15px; text-align: center; border-bottom: 3px solid #d41227;">
              <img src="https://www.info-peche.fr/images/info-peche-logo.png" alt="Info Pêche" style="height: 60px;" />
            </div>
            <div style="padding: 30px 25px;">
              <h2 style="color: #1a1a1a; margin: 0 0 15px; font-family: 'Playfair Display', Georgia, serif;">
                Bienvenue sur Info Pêche !
              </h2>
              <p style="color: #555; line-height: 1.6; font-family: 'Inter', Arial, sans-serif; font-size: 15px;">
                Votre compte a été créé avec succès avec l'adresse <strong>${email}</strong>.
              </p>
              <p style="color: #555; line-height: 1.6; font-family: 'Inter', Arial, sans-serif; font-size: 15px;">
                Vous pouvez dès maintenant vous connecter à votre espace personnel pour découvrir nos offres d'abonnement et profiter de contenus exclusifs.
              </p>

              <div style="background: #fef9e7; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center; border: 1px solid #f5c800;">
                <h3 style="color: #d41227; margin: 0 0 10px; font-family: 'Playfair Display', Georgia, serif;">🎣 Accédez à votre espace</h3>
                <p style="color: #555; line-height: 1.6; margin: 0 0 15px; font-family: 'Inter', Arial, sans-serif; font-size: 14px;">
                  Connectez-vous pour explorer le magazine N°1 de la pêche au coup.
                </p>
                <a href="https://www.info-peche.fr/mon-compte" style="display: inline-block; background: #d41227; color: #fff; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; font-family: 'Inter', Arial, sans-serif;">
                  Mon compte Info Pêche
                </a>
              </div>

              <div style="background: #fef9e7; border-left: 4px solid #f5c800; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="color: #333; font-family: 'Inter', Arial, sans-serif; font-size: 14px; margin: 0;">
                  <strong>💡 Bon à savoir :</strong> En vous abonnant, vous bénéficiez d'un accès exclusif aux articles premium, aux archives du magazine et bien plus encore !
                </p>
              </div>

              <p style="color: #555; line-height: 1.6; margin-top: 20px; font-family: 'Inter', Arial, sans-serif; font-size: 14px;">
                Pour toute question, n'hésitez pas à nous contacter. Bonne pêche !
              </p>
            </div>
            <div style="background: #d41227; text-align: center; padding: 15px; color: #ffffff; font-size: 12px; font-family: 'Inter', Arial, sans-serif;">
              Info Pêche Magazine — La passion de la pêche au coup
            </div>
          </div>
        `,
      }),
    });

    const emailResult = await result.json();
    console.log("[SEND-SIGNUP-EMAIL] Email sent", emailResult);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[SEND-SIGNUP-EMAIL] ERROR", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
