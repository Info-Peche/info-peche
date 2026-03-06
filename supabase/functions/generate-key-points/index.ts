import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { content, title } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Tu es un rédacteur expert pour Info-Pêche, magazine de référence de la pêche au coup.

On te donne le contenu brut d'un article et son titre. Tu dois extraire 4 à 6 points clés qui résument l'essentiel de l'article pour le bloc "L'essentiel de l'article" affiché en haut de page.

RÈGLES :
- Chaque point doit faire 1 à 2 phrases maximum, clair et informatif
- Mets en **gras** les mots ou expressions les plus importants de chaque point
- Les points doivent couvrir les informations principales : sujet, technique, espèce ciblée, matériel, conseil clé
- Utilise le vocabulaire technique de la pêche au coup quand c'est pertinent
- Ne commence pas chaque point par le même mot
- Pas de numérotation, juste le texte de chaque point`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Titre de l'article : "${title}"\n\nContenu :\n${content.substring(0, 8000)}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_key_points",
              description: "Retourne les points clés de l'article",
              parameters: {
                type: "object",
                properties: {
                  key_points: {
                    type: "array",
                    items: { type: "string" },
                    description: "Liste de 4 à 6 points clés résumant l'essentiel de l'article",
                  },
                },
                required: ["key_points"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_key_points" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte, réessayez dans quelques instants." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const args = JSON.parse(toolCall.function.arguments);
    
    return new Response(JSON.stringify({ key_points: args.key_points }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-key-points error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
