import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { images } = await req.json();
    // images: Array<{ url: string; caption?: string }>

    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(JSON.stringify({ alt_texts: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build user content with image URLs for multimodal analysis
    const userContent: any[] = [
      {
        type: "text",
        text: `Décris chaque image en 5 à 10 mots maximum pour un attribut alt SEO. 
Contexte : magazine de pêche au coup.
Sois factuel et descriptif : décris ce que tu vois (personne, poisson, action, lieu).
Exemples de bons alt : "Pêcheur tenant un gardon au bord de l'eau", "Boîte de montage avec hameçons rangés", "Barbeau pris à la grande canne".
${images.length} image(s) à décrire.`,
      },
    ];

    for (const img of images) {
      userContent.push({
        type: "image_url",
        image_url: { url: img.url },
      });
      if (img.caption) {
        userContent.push({
          type: "text",
          text: `Légende associée : "${img.caption}"`,
        });
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: userContent,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_alt_texts",
              description: "Retourne les textes alt pour chaque image, dans le même ordre",
              parameters: {
                type: "object",
                properties: {
                  alt_texts: {
                    type: "array",
                    items: { type: "string" },
                    description: "Liste des descriptions alt courtes, une par image, dans l'ordre",
                  },
                },
                required: ["alt_texts"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_alt_texts" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const args = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ alt_texts: args.alt_texts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-alt-text error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
