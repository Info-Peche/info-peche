import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
};

const BASE_URL = "https://www.info-peche.fr";

const staticPages = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/blog", changefreq: "daily", priority: "0.9" },
  { loc: "/boutique", changefreq: "weekly", priority: "0.8" },
  { loc: "/sipac", changefreq: "monthly", priority: "0.7" },
  { loc: "/specimen-trophy", changefreq: "monthly", priority: "0.7" },
  { loc: "/coins-peche", changefreq: "weekly", priority: "0.8" },
  { loc: "/evenements", changefreq: "monthly", priority: "0.6" },
  { loc: "/contact", changefreq: "yearly", priority: "0.5" },
  { loc: "/mentions-legales", changefreq: "yearly", priority: "0.3" },
  { loc: "/cgv", changefreq: "yearly", priority: "0.3" },
];

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch published blog articles
  const { data: articles } = await supabase
    .from("blog_articles")
    .select("slug, updated_at, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Static pages
  for (const page of staticPages) {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}${page.loc}</loc>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  // Blog articles
  if (articles) {
    for (const article of articles) {
      const lastmod = (article.updated_at || article.published_at || "").split("T")[0];
      xml += `  <url>\n`;
      xml += `    <loc>${BASE_URL}/blog/${article.slug}</loc>\n`;
      if (lastmod) xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>monthly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    }
  }

  xml += `</urlset>`;

  return new Response(xml, { headers: corsHeaders });
});
