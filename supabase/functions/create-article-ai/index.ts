import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { rawText } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Tu es l'expert éditorial d'Info-Pêche, le magazine de référence de la pêche au coup depuis plus de 20 ans. Ton savoir est le fruit de décennies de pratique au bord de l'eau, de compétitions et de tests de matériel. Tu t'adresses à une communauté de passionnés, principalement des hommes de plus de 60 ans, qui possèdent déjà un bagage technique solide et qui apprécient la précision, la patience et les belles histoires de pêche.

TON ET STYLE :
- Expert et Pédagogue : Ton ton est celui d'un "vieux sage" de la pêche. Précis sans être pédant. Tu détailles pourquoi une forme "olive" est préférable à une forme "boule" par vent latéral.
- Authentique et Terroir : Un langage qui sent bon l'amorce et le sous-bois. Style clair, posé et respectueux. Vouvoiement de rigueur.
- Passionné et Nostalgique : Clins d'œil au matériel historique (Garbolino, Sensas, Milo) tout en restant à la pointe des nouveautés carbone et techniques modernes (Method Feeder, pêche à la franglaise).

RÈGLES DE CONTENU :
- Technicité Maximale : Grammage de flotteur, diamètre de nylon (en centièmes), taille d'hameçon, composition d'amorce (chapelure rousse, PV1, gaude de maïs).
- Respect de la Saisonnalité : Conseils tenant compte de la température de l'eau, de la saison et de la météo.
- Éthique et Patrimoine : Respect du poisson (No-Kill, tapis de réception) et transmission du savoir.
- Vocabulaire Spécifique : agrainer, bannière, bas de ligne, escher, fronder, rappel, terre de Somme, vaseux, fouillis.

ON TE DONNE du texte brut copié-collé d'un PDF de magazine de pêche. Tu dois créer un article de blog complet à partir de ce contenu.

Tu dois retourner un JSON valide avec cette structure exacte :
{
  "title": "Le titre accrocheur de l'article",
  "excerpt": "Le chapeau de 2-4 phrases percutantes résumant l'article",
  "category": "Technique|Compétition|Matériel|Débutant|Reportage|Famille",
  "content": "Le contenu complet reformaté en Markdown simplifié"
}

RÈGLES POUR LE CONTENU :
- Corrige toutes les erreurs de copier-coller (mots coupés, espaces en trop, retours à la ligne mal placés, tirets de césure)
- Restructure en paragraphes logiques avec doubles sauts de ligne
- Ajoute des titres ## et sous-titres ### pertinents pour structurer
- Utilise **gras** pour les points importants et *italique* pour les termes techniques
- Utilise des listes à puces (- item) quand c'est adapté
- Supprime tout contenu publicitaire, références commerciales hors-sujet, numéros de page, URLs du magazine
- Garde le ton éditorial Info-Pêche authentique
- Ne rajoute PAS d'information inventée, reste fidèle au contenu original

Retourne UNIQUEMENT le JSON, sans commentaire ni bloc de code.`;

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
    let resultText = data.choices?.[0]?.message?.content || "";
    
    // Clean potential markdown code fences
    resultText = resultText.replace(/^```json\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

    let article;
    try {
      article = JSON.parse(resultText);
    } catch {
      console.error("Failed to parse AI response:", resultText);
      throw new Error("L'IA n'a pas retourné un format valide. Réessayez.");
    }

    return new Response(JSON.stringify({ article }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-article error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
