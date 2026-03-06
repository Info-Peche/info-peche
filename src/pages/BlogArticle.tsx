import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Calendar, User, Clock, Crown, LogIn, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SideCart from "@/components/SideCart";
import YouTubeSidebar from "@/components/YouTubeSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";

type TocItem = { text: string; anchor: string; level: number };

const generateAnchor = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Parse TOC block from content
const parseToc = (content: string): TocItem[] => {
  const tocMatch = content.match(/\[TOC\]([\s\S]*?)\[\/TOC\]/);
  if (!tocMatch) return [];
  const items: TocItem[] = [];
  const lines = tocMatch[1].trim().split("\n");
  for (const line of lines) {
    const match = line.match(/^\s*- \[(.+?)\]\(#(.+?)\)/);
    if (match) {
      const indent = line.match(/^\s*/)?.[0]?.length || 0;
      items.push({ text: match[1], anchor: match[2], level: indent >= 2 ? 3 : 2 });
    }
  }
  return items;
};

// Strip TOC block from content
const stripToc = (content: string): string =>
  content.replace(/\[TOC\][\s\S]*?\[\/TOC\]\n*/g, "");

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, hasAccessToBlog } = useAuth();

  const { data: article, isLoading } = useQuery({
    queryKey: ["blog-article", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_articles").select("*").eq("slug", slug).single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: relatedIssue } = useQuery({
    queryKey: ["related-issue", article?.related_issue_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("digital_issues").select("youtube_video_url")
        .eq("id", article!.related_issue_id!).single();
      if (error) return null;
      return data;
    },
    enabled: !!article?.related_issue_id,
  });

  const estimateReadTime = (text: string) => Math.max(1, Math.round(text.split(/\s+/).length / 200));

  const toc = useMemo(() => article ? parseToc(article.content) : [], [article]);

  const renderContent = (text: string) => {
    const cleanText = stripToc(text);
    let firstTextRendered = false;
    let imageCounter = 0;

    const formatInlineHtml = (str: string) =>
      str
        .replace(/\*\*(.*?)\*\*/g, "<strong class='text-foreground font-semibold'>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Pre-process: protect :::conseil blocks by replacing inner \n\n with a placeholder
    const protectedText = cleanText.replace(/:::conseil\s+[\s\S]*?:::/g, (match) => 
      match.replace(/\n\n/g, "\n%%KEEP%%\n")
    );

    return protectedText.split("\n\n").map((rawParagraph, i) => {
      // Restore protected newlines
      const paragraph = rawParagraph.replace(/\n%%KEEP%%\n/g, "\n\n");
      const trimmed = paragraph.trim();
      if (!trimmed) return null;

      // "Le conseil du prof" block: :::conseil TITRE\nTexte...\n[IMAGE](url){caption:...}\n:::
      const conseilMatch = trimmed.match(/^:::conseil\s+(.+?)\n([\s\S]*?):::$/);
      if (conseilMatch) {
        const conseilTitle = conseilMatch[1].trim();
        const conseilBody = conseilMatch[2].trim();
        // Extract image if present inside the block
        const conseilImgMatch = conseilBody.match(/\[IMAGE\]\((.*?)\)\{caption:(.*?)\}/);
        const conseilText = conseilBody.replace(/\[IMAGE\]\(.*?\)\{caption:.*?\}/, "").trim();
        return (
          <div key={i} className="my-10 bg-primary/5 border border-primary/20 rounded-2xl overflow-hidden clear-both">
            <div className="bg-primary/10 px-6 py-3 flex items-center gap-3">
              <span className="text-2xl">🎓</span>
              <span className="text-sm font-bold uppercase tracking-wider text-primary">Le conseil du prof</span>
            </div>
            <div className="p-6 md:p-8">
              <h4 className="text-xl md:text-2xl font-bold text-foreground font-[Playfair_Display] mb-4">{conseilTitle}</h4>
              <p className="text-[1.05rem] leading-[1.85] text-foreground/85 mb-4" dangerouslySetInnerHTML={{ __html: formatInlineHtml(conseilText) }} />
              {conseilImgMatch && (
                <figure className="mt-4">
                  <div className="overflow-hidden rounded-xl shadow-md">
                    <img src={conseilImgMatch[1]} alt={conseilImgMatch[2]?.trim() || ""} className="w-full max-h-[400px] object-cover" loading="lazy" />
                  </div>
                  {conseilImgMatch[2]?.trim() && (
                    <figcaption className="mt-2 text-xs text-muted-foreground italic text-center">{conseilImgMatch[2].trim()}</figcaption>
                  )}
                </figure>
              )}
            </div>
          </div>
        );
      }

      // Image block with varied layouts
      const imgMatch = trimmed.match(/^\[IMAGE\]\((.*?)\)\{caption:(.*?)\}$/);
      if (imgMatch) {
        imageCounter++;
        const layout = imageCounter % 3; // 0=full, 1=float-left, 2=float-right
        const caption = imgMatch[2]?.trim();

        if (layout === 1) {
          return (
            <figure key={i} className="md:float-left md:w-[35%] md:mr-6 md:mb-3 my-6 md:my-1">
              <div className="overflow-hidden rounded-lg shadow-md">
                <img src={imgMatch[1]} alt={caption || ""} className="w-full object-cover" loading="lazy" />
              </div>
              {caption && (
                <figcaption className="mt-1.5 text-[11px] text-muted-foreground italic text-center leading-tight">
                  {caption}
                </figcaption>
              )}
            </figure>
          );
        }
        if (layout === 2) {
          return (
            <figure key={i} className="md:float-right md:w-[35%] md:ml-6 md:mb-3 my-6 md:my-1">
              <div className="overflow-hidden rounded-lg shadow-md">
                <img src={imgMatch[1]} alt={caption || ""} className="w-full object-cover" loading="lazy" />
              </div>
              {caption && (
                <figcaption className="mt-1.5 text-[11px] text-muted-foreground italic text-center leading-tight">
                  {caption}
                </figcaption>
              )}
            </figure>
          );
        }
        // Full width (layout === 0)
        return (
          <figure key={i} className="my-10 md:my-14 clear-both">
            <div className="overflow-hidden rounded-xl shadow-md">
              <img src={imgMatch[1]} alt={caption || ""} className="w-full max-h-[500px] object-cover" loading="lazy" />
            </div>
            {caption && (
              <figcaption className="mt-3 text-sm text-muted-foreground italic text-center flex items-center justify-center gap-2">
                <span className="w-8 h-px bg-primary/40 inline-block" />
                {caption}
                <span className="w-8 h-px bg-primary/40 inline-block" />
              </figcaption>
            )}
          </figure>
        );
      }

      // H2
      if (trimmed.startsWith("## ")) {
        const headingText = trimmed.replace("## ", "");
        const anchor = generateAnchor(headingText);
        return (
          <h2 key={i} id={anchor} className="text-2xl md:text-3xl font-bold text-foreground mt-14 mb-6 font-[Playfair_Display] border-l-4 border-primary pl-5 scroll-mt-24 clear-both">
            {headingText}
          </h2>
        );
      }

      // H3
      if (trimmed.startsWith("### ")) {
        const headingText = trimmed.replace("### ", "");
        const anchor = generateAnchor(headingText);
        return (
          <h3 key={i} id={anchor} className="text-xl md:text-2xl font-bold text-foreground mt-10 mb-4 font-[Playfair_Display] scroll-mt-24 clear-both">
            {headingText}
          </h3>
        );
      }

      // Numbered list (lines starting with "1. ", "2. ", etc.)
      if (/^\d+\.\s/.test(trimmed)) {
        const items = trimmed.split("\n").filter(l => /^\d+\.\s/.test(l.trim()));
        if (items.length > 0) {
          return (
            <ol key={i} className="my-6 space-y-4 pl-0 list-none">
              {items.map((item, j) => {
                const text = item.replace(/^\d+\.\s*/, "");
                // Split on first period to get title + description
                const dotIndex = text.indexOf(".");
                const hasTitle = dotIndex > 0 && dotIndex < 40;
                return (
                  <li key={j} className="flex gap-4 items-start bg-muted/30 rounded-xl p-4 border border-border/40">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      {j + 1}
                    </span>
                    <div className="flex-1">
                      {hasTitle ? (
                        <>
                          <span className="font-semibold text-foreground" dangerouslySetInnerHTML={{ __html: formatInlineHtml(text.substring(0, dotIndex + 1)) }} />
                          <span className="text-foreground/85" dangerouslySetInnerHTML={{ __html: " " + formatInlineHtml(text.substring(dotIndex + 1).trim()) }} />
                        </>
                      ) : (
                        <span dangerouslySetInnerHTML={{ __html: formatInlineHtml(text) }} />
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          );
        }
      }

      // Bullet list
      if (trimmed.startsWith("- ")) {
        const items = trimmed.split("\n").filter(Boolean);
        return (
          <ul key={i} className="my-6 space-y-3 pl-0">
            {items.map((item, j) => (
              <li key={j} className="flex gap-3 items-start">
                <span className="mt-2 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                <span dangerouslySetInnerHTML={{ __html: formatInlineHtml(item.replace(/^- /, "")) }} />
              </li>
            ))}
          </ul>
        );
      }

      // Pull-quote / blockquote
      if (trimmed.startsWith("> ")) {
        return (
          <blockquote key={i} className="my-10 py-6 px-8 border-l-4 border-primary bg-primary/5 rounded-r-xl text-lg italic text-foreground/80 font-[Playfair_Display] clear-both">
            {trimmed.replace(/^> /gm, "")}
          </blockquote>
        );
      }

      // Callout block (:::info ... :::)
      if (trimmed.startsWith(":::")) {
        const typeMatch = trimmed.match(/^:::(info|tip|warning|note)\s*/);
        const type = typeMatch?.[1] || "info";
        const body = trimmed.replace(/^:::\w*\s*/, "").replace(/\s*:::$/, "");
        const colors: Record<string, string> = {
          info: "bg-blue-50 border-blue-400 text-blue-900 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-600",
          tip: "bg-emerald-50 border-emerald-400 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-600",
          warning: "bg-amber-50 border-amber-400 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-600",
          note: "bg-muted border-border text-foreground",
        };
        const icons: Record<string, string> = { info: "💡", tip: "✅", warning: "⚠️", note: "📌" };
        return (
          <div key={i} className={`my-8 p-5 rounded-xl border-l-4 ${colors[type]} clear-both`}>
            <p className="font-medium text-sm">
              <span className="mr-2">{icons[type]}</span>
              <span dangerouslySetInnerHTML={{ __html: formatInlineHtml(body) }} />
            </p>
          </div>
        );
      }

      // Drop cap for first substantial paragraph
      if (!firstTextRendered && trimmed.length > 80) {
        firstTextRendered = true;
        const firstLetter = trimmed[0];
        const rest = trimmed.slice(1);
        return (
          <p key={i} className="my-6 text-lg leading-[1.9] text-foreground/85 clear-both">
            <span className="float-left text-6xl font-bold font-[Playfair_Display] text-primary leading-[0.8] mr-3 mt-1">
              {firstLetter}
            </span>
            <span dangerouslySetInnerHTML={{ __html: formatInlineHtml(rest) }} />
          </p>
        );
      }

      firstTextRendered = true;

      return (
        <p key={i} className="my-5 text-[1.08rem] leading-[1.9] text-foreground/85" dangerouslySetInnerHTML={{
          __html: formatInlineHtml(trimmed)
        }} />
      );
    });
  };

  const getDisplayContent = () => {
    if (!article) return "";
    if (article.is_free) return article.content;
    if (user && hasAccessToBlog) return article.content;
    const cutoff = article.paywall_preview_length || 500;
    const content = article.content;
    let cut = content.indexOf("\n\n", cutoff);
    if (cut === -1) cut = cutoff;
    return content.substring(0, cut);
  };

  const showPaywall = article && !article.is_free && !(user && hasAccessToBlog);

  // SEO
  useEffect(() => {
    if (!article) return;
    document.title = `${article.title} | Info Pêche`;
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(name.startsWith("og:") ? "property" : "name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", article.excerpt.substring(0, 160));
    setMeta("og:title", article.title);
    setMeta("og:description", article.excerpt.substring(0, 160));
    setMeta("og:type", "article");
    if (article.cover_image) setMeta("og:image", article.cover_image);

    let scriptEl = document.querySelector('script[data-jsonld="article"]') as HTMLScriptElement | null;
    if (!scriptEl) { scriptEl = document.createElement("script"); scriptEl.type = "application/ld+json"; scriptEl.setAttribute("data-jsonld", "article"); document.head.appendChild(scriptEl); }
    scriptEl.textContent = JSON.stringify({
      "@context": "https://schema.org", "@type": "Article",
      headline: article.title, description: article.excerpt,
      image: article.cover_image || undefined,
      author: { "@type": "Organization", name: article.author || "Info Pêche" },
      publisher: { "@type": "Organization", name: "Info Pêche" },
      datePublished: article.published_at, dateModified: article.updated_at || article.published_at,
      mainEntityOfPage: window.location.href,
    });
    return () => { document.title = "Info Pêche"; scriptEl?.remove(); };
  }, [article]);

  // Smooth scroll
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => { document.documentElement.style.scrollBehavior = "auto"; };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SideCart />

      <main className="pt-20">
        {isLoading ? (
          <div className="container mx-auto px-4 max-w-4xl pt-20">
            <Skeleton className="h-[50vh] w-full rounded-none mb-8" />
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/2 mb-8" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : !article ? (
          <div className="text-center pt-28">
            <h1 className="text-3xl font-bold mb-4 text-foreground">Article introuvable</h1>
            <Link to="/blog"><Button variant="outline">Retour au blog</Button></Link>
          </div>
        ) : (
          <>
            {/* Hero */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-full h-[55vh] md:h-[65vh] overflow-hidden">
              <img
                src={article.cover_image || "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1200&h=600&fit=crop"}
                alt={article.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-10 md:pb-16">
                <div className="container mx-auto max-w-4xl">
                  <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full font-semibold text-xs uppercase tracking-wider">
                        {article.category}
                      </span>
                      {!article.is_free && (
                        <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full font-semibold text-xs uppercase tracking-wider flex items-center gap-1">
                          <Lock className="h-3 w-3" /> Premium
                        </span>
                      )}
                    </div>
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight font-[Playfair_Display] mb-4">
                      {article.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-white/70 text-sm">
                      <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> {article.author}</span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {new Date(article.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                      <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {estimateReadTime(article.content)} min de lecture</span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Content area */}
            <div className="container mx-auto px-4 max-w-5xl py-10 md:py-16">
              <div className="grid lg:grid-cols-[1fr_280px] gap-12">
                <article>
                  {/* Excerpt */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-10 pb-8 border-b border-border">
                    <p className="text-xl md:text-2xl leading-relaxed text-foreground/70 font-[Playfair_Display] italic">
                      {article.excerpt}
                    </p>
                  </motion.div>

                  {/* TOC */}
                  {toc.length > 0 && !showPaywall && (
                    <motion.nav
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      className="bg-muted/40 border border-border/60 rounded-2xl p-6 md:p-8 mb-12"
                    >
                      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-5 flex items-center gap-2">
                        <ListOrdered className="w-4 h-4" /> Sommaire
                      </h2>
                      <ol className="space-y-2.5">
                        {toc.map((item, i) => {
                          const h2Index = toc.filter((t, j) => t.level === 2 && j <= i).length;
                          return (
                            <li key={i} className={`${item.level === 3 ? "ml-6" : ""}`}>
                              <a
                                href={`#${item.anchor}`}
                                className={`group flex items-center gap-2 text-sm hover:text-primary transition-colors ${
                                  item.level === 2 ? "font-medium text-foreground" : "text-muted-foreground"
                                }`}
                              >
                                {item.level === 2 && (
                                  <span className="text-primary font-bold text-xs w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    {h2Index}
                                  </span>
                                )}
                                <span className="group-hover:underline underline-offset-2">{item.text}</span>
                              </a>
                            </li>
                          );
                        })}
                      </ol>
                    </motion.nav>
                  )}

                  {/* Article content */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="article-body">
                    {renderContent(getDisplayContent())}
                  </motion.div>

                  {/* Paywall */}
                  {showPaywall && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-8 relative">
                      <div className="absolute -top-24 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
                      <div className="bg-card border border-border rounded-2xl p-8 md:p-12 text-center shadow-xl">
                        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
                          <Lock className="h-7 w-7 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-2 font-[Playfair_Display]">
                          La suite est réservée à nos abonnés
                        </h3>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                          Accédez à l'intégralité de cet article et à tout le contenu premium Info Pêche avec un abonnement.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-8" onClick={() => { window.location.href = "/#subscribe"; }}>
                            <Crown className="w-4 h-4 mr-2" /> Je m'abonne
                          </Button>
                          <Button variant="outline" size="lg" className="rounded-full px-8" onClick={() => navigate("/mon-compte")}>
                            <LogIn className="w-4 h-4 mr-2" /> Déjà abonné
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Back link */}
                  <div className="mt-14 pt-8 border-t border-border">
                    <Link to="/blog" className="inline-flex items-center text-primary font-medium hover:underline text-sm">
                      <ArrowLeft className="mr-2 h-4 w-4" /> Retour au blog
                    </Link>
                  </div>
                </article>

                {/* Sidebar */}
                <aside className="hidden lg:block">
                  <div className="sticky top-28 space-y-6">
                    {/* Sticky TOC on sidebar */}
                    {toc.length > 0 && !showPaywall && (
                      <nav className="bg-muted/30 border border-border/50 rounded-xl p-5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Dans cet article</h3>
                        <ul className="space-y-2">
                          {toc.filter(t => t.level === 2).map((item, i) => (
                            <li key={i}>
                              <a href={`#${item.anchor}`} className="text-sm text-muted-foreground hover:text-primary transition-colors block py-0.5">
                                {item.text}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </nav>
                    )}
                    <YouTubeSidebar videoUrl={relatedIssue?.youtube_video_url} />
                  </div>
                </aside>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default BlogArticle;
