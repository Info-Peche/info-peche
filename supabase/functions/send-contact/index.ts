import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAIL = "jeanfrancois.darnet@info-peche.fr";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      throw new Error("Tous les champs sont requis.");
    }

    // Basic validation
    if (name.length > 100 || email.length > 255 || subject.length > 200 || message.length > 5000) {
      throw new Error("Un ou plusieurs champs dépassent la longueur maximale.");
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not configured");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Info Pêche Contact <contact@info-peche.fr>",
        to: [ADMIN_EMAIL],
        reply_to: email,
        subject: `[Contact] ${subject}`,
        html: `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: #d41227; padding: 15px; text-align: center;">
              <img src="https://www.info-peche.fr/images/info-peche-logo.png" alt="Info Pêche" style="height: 50px;" />
            </div>
            <div style="padding: 25px;">
              <h2 style="color: #d41227; font-family: 'Playfair Display', Georgia, serif;">Nouveau message de contact</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Nom</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${email}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Sujet</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${subject}</td></tr>
              </table>
              <div style="margin-top: 20px; padding: 15px; background: #fef9e7; border-left: 4px solid #f5c800; border-radius: 5px;">
                <p style="white-space: pre-wrap; margin: 0;">${message}</p>
              </div>
            </div>
            <div style="background: #d41227; text-align: center; padding: 12px; color: #ffffff; font-size: 12px;">
              Info Pêche Magazine — Administration
            </div>
          </div>
        `,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(`Email error: ${JSON.stringify(result)}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
