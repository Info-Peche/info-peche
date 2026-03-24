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
    const { email, isFirstLogin, skipEmail } = await req.json();
    if (!email) throw new Error("email is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not configured");

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const normalizedEmail = email.toLowerCase().trim();

    if (isFirstLogin) {
      // Check if email exists in clients table
      const { data: client } = await supabaseAdmin
        .from("clients")
        .select("id, first_name")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (!client) {
        return new Response(
          JSON.stringify({ error: "Aucun abonnement trouvé pour cette adresse email. Vérifiez l'adresse ou contactez-nous." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }

      // Check if user already exists in auth
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        (u) => u.email?.toLowerCase() === normalizedEmail
      );

      if (existingUser && existingUser.last_sign_in_at) {
        // User has already signed in = password already set
        return new Response(
          JSON.stringify({ error: "Votre mot de passe a déjà été créé. Utilisez \"Se connecter\" ou \"Mot de passe oublié\" si vous l'avez perdu." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      if (!existingUser) {
        // Create auth account with a random password (user will set their own via recovery link)
        const randomPwd = crypto.randomUUID() + crypto.randomUUID();
        const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: normalizedEmail,
          password: randomPwd,
          email_confirm: true,
        });
        if (createErr) {
          console.error("[SEND-RESET] Create user error:", createErr.message);
          throw new Error("Erreur lors de la création du compte.");
        }
        console.log("[SEND-RESET] Created auth user for", normalizedEmail);
      }
    } else {
      // Regular forgot password: check if user exists in auth
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const userExists = existingUsers?.users?.some(
        (u) => u.email?.toLowerCase() === normalizedEmail
      );

      if (!userExists) {
        return new Response(
          JSON.stringify({ error: "Aucun compte n'existe pour cette adresse email." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }
    }

    // If skipEmail is true, just ensure the auth account exists, don't send email
    if (skipEmail) {
      console.log("[SEND-RESET] skipEmail=true, auth account ensured for", normalizedEmail);
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate recovery link
    const siteUrl = "https://www.info-peche.fr";
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: normalizedEmail,
      });

    if (linkError) {
      console.error("[SEND-RESET] generateLink error:", linkError.message);
      throw new Error("Impossible de générer le lien de réinitialisation.");
    }

    // Use hashed_token to build a direct link to info-peche.fr
    // This bypasses Supabase's /auth/v1/verify redirect (which uses Site URL)
    const tokenHash = linkData?.properties?.hashed_token;
    if (!tokenHash) throw new Error("Aucun token généré.");

    const actionLink = `${siteUrl}/reset-password?token_hash=${encodeURIComponent(tokenHash)}&type=recovery`;

    console.log("[SEND-RESET] Generated direct recovery link for", normalizedEmail);

    // Determine email content based on context
    const isFirst = isFirstLogin === true;
    const subject = isFirst
      ? "🎣 Activez votre espace abonné Info Pêche"
      : "🔑 Réinitialisation de votre mot de passe Info Pêche";
    const heading = isFirst
      ? "Bienvenue sur votre espace abonné !"
      : "Réinitialisation de mot de passe";
    const intro = isFirst
      ? `Votre espace abonné Info Pêche est prêt ! Pour y accéder, vous devez créer votre mot de passe en cliquant sur le bouton ci-dessous.`
      : `Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en définir un nouveau.`;
    const ctaLabel = isFirst ? "Créer mon mot de passe" : "Réinitialiser mon mot de passe";

    // Send branded email via Resend
    const result = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Info Pêche <jeanfrancois.darnet@info-peche.fr>",
        to: [normalizedEmail],
        subject,
        html: `
          <div style="font-family: 'Playfair Display', Georgia, serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: #ffffff; padding: 25px 20px 15px; text-align: center; border-bottom: 3px solid #d41227;">
              <img src="https://www.info-peche.fr/images/info-peche-logo.png" alt="Info Pêche" style="height: 60px;" />
            </div>
            <div style="padding: 30px 25px;">
              <h2 style="color: #1a1a1a; margin: 0 0 15px; font-family: 'Playfair Display', Georgia, serif;">
                ${heading}
              </h2>
              <p style="color: #555; line-height: 1.6; font-family: 'Inter', Arial, sans-serif; font-size: 15px;">
                ${intro}
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${actionLink}" style="display: inline-block; background: #d41227; color: #ffffff; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; font-family: 'Inter', Arial, sans-serif;">
                  ${ctaLabel}
                </a>
              </div>
              <p style="color: #999; line-height: 1.6; font-family: 'Inter', Arial, sans-serif; font-size: 13px;">
                Ce lien est valable pendant 24 heures. Si vous n'avez pas fait cette demande, ignorez simplement cet email.
              </p>
              <div style="background: #fef9e7; border-left: 4px solid #f5c800; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="color: #333; font-family: 'Inter', Arial, sans-serif; font-size: 13px; margin: 0;">
                  <strong>💡 Astuce :</strong> Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br/>
                  <a href="${actionLink}" style="color: #d41227; word-break: break-all; font-size: 12px;">${actionLink}</a>
                </p>
              </div>
            </div>
            <div style="background: #d41227; text-align: center; padding: 15px; color: #ffffff; font-size: 12px; font-family: 'Inter', Arial, sans-serif;">
              Info Pêche Magazine — La passion de la pêche au coup
            </div>
          </div>
        `,
      }),
    });

    const emailResult = await result.json();
    console.log("[SEND-RESET] Email sent:", emailResult);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[SEND-RESET] ERROR:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
