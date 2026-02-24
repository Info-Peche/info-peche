import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { rawText, type } = await req.json();
    // type: "chapeau" | "content"

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = type === "chapeau"
      ? `Tu es un rédacteur de presse spécialisé dans la pêche. On te donne du texte brut copié-collé d'un PDF de magazine. 
Tu dois reformater ce texte en un chapeau d'article de blog : 2-4 phrases d'accroche percutantes et fluides.
- Corrige les erreurs de copier-coller (mots coupés, espaces en trop, retours à la ligne mal placés)
- Garde le sens et le style éditorial original
- Ne rajoute PAS d'information inventée
- Retourne UNIQUEMENT le texte reformaté, sans commentaire ni explication.`
      : `Tu es un rédacteur de presse spécialisé dans la pêche. On te donne du texte brut copié-collé d'un PDF de magazine.
Tu dois reformater ce texte en article de blog avec une mise en page parfaite en Markdown simplifié :
- Corrige les erreurs de copier-coller (mots coupés par des retours à la ligne, espaces en trop, tirets de césure)
- Restructure en paragraphes logiques bien séparés par des doubles sauts de ligne
- Ajoute des titres ## et sous-titres ### là où c'est pertinent pour structurer l'article
- Utilise **gras** pour les points importants et *italique* pour les citations ou termes techniques
- Utilise des listes à puces (- item) quand c'est adapté (avantages, inconvénients, étapes)
- Supprime tout contenu publicitaire, références de produits commerciaux hors-sujet, numéros de page, URLs du magazine
- Garde le ton éditorial original et ne rajoute PAS d'information inventée
- Retourne UNIQUEMENT le texte reformaté en Markdown, sans commentaire ni explication.`;

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
          { role: "user", content: rawText },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans un moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("reformat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
