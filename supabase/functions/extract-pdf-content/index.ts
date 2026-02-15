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
    const { pdf_path, prompt } = await req.json();
    if (!pdf_path) throw new Error("pdf_path is required");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get signed URL for the PDF
    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from("magazine-pdfs")
      .createSignedUrl(pdf_path, 3600);

    if (signError || !signedData?.signedUrl) {
      throw new Error("Could not generate signed URL for PDF");
    }

    // Download the PDF
    const pdfResponse = await fetch(signedData.signedUrl);
    if (!pdfResponse.ok) throw new Error("Failed to download PDF");

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = btoa(
      new Uint8Array(pdfBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    console.log(`PDF downloaded, size: ${pdfBuffer.byteLength} bytes`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const defaultPrompt = `Analyse ce magazine de pêche PDF. Extrais:
1. Une description détaillée de la couverture (couleurs, images, texte visible)
2. Le sommaire / table des matières si visible
3. Tout article ou section concernant "l'asticot rouge" ou les appâts naturels - extrais le contenu complet de cet article avec tous les détails techniques.

Réponds en JSON avec cette structure:
{
  "cover_description": "description détaillée de la couverture",
  "table_of_contents": ["liste des articles"],
  "target_article": {
    "title": "titre de l'article",
    "content": "contenu complet de l'article en markdown",
    "key_points": ["points clés"]
  }
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt || defaultPrompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${pdfBase64}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    return new Response(JSON.stringify({ result: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
