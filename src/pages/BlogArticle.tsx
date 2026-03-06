import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Calendar, User, Clock, Crown, LogIn, ListOrdered, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SideCart from "@/components/SideCart";
import YouTubeSidebar from "@/components/YouTubeSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import "@/components/TipTapStyles.css";

type TocItem = { text: string; anchor: string; level: number };

const generateAnchor = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Extract TOC from HTML content by parsing headings
const extractTocFromHtml = (html: string): TocItem[] => {
  const items: TocItem[] = [];
  const regex = /<h([234])[^>]*>(.*?)<\/h[234]>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1]);
    const text = match[2].replace(/<[^>]*>/g, "").trim();
    if (text && level <= 3) {
      items.push({ text, anchor: generateAnchor(text), level });
    }
  }
  return items;
};

// Inject anchors into heading tags in HTML
const injectAnchors = (html: string): string => {
  return html.replace(/<h([234])([^>]*)>(.*?)<\/h([234])>/gi, (match, level, attrs, content, closeLevel) => {
    const text = content.replace(/<[^>]*>/g, "").trim();
    const anchor = generateAnchor(text);
    return `<h${level}${attrs} id="${anchor}">${content}</h${level}>`;
  });
};

// Post-process HTML: convert img with data-caption/data-layout into figure/figcaption
const postProcessImages = (html: string): string => {
  // Split by existing <figure> blocks to avoid double-wrapping
  const parts = html.split(/(<figure[\s\S]*?<\/figure>)/g);
  return parts.map(part => {
    if (part.startsWith('<figure')) return part;
    return part.replace(
      /<img([^>]*?)\/?\s*>/g,
      (match, attrs) => {
        const captionMatch = attrs.match(/data-caption="([^"]*)"/);
        const layoutMatch = attrs.match(/data-layout="([^"]*)"/);
        const caption = captionMatch?.[1];
        const layout = layoutMatch?.[1];
        if (!caption && (!layout || layout === 'center')) return match;
        const layoutClass = layout && layout !== 'center' ? ` class="image-${layout}"` : '';
        if (caption) {
          return `<figure${layoutClass}><img${attrs} /><figcaption>${caption}</figcaption></figure>`;
        }
        return `<figure${layoutClass}><img${attrs} /></figure>`;
      }
    );
  }).join('');
};

// Legacy markdown → HTML converter for old articles
const convertLegacyToHtml = (content: string): string => {
  if (content.trim().startsWith("<") && (content.includes("</p>") || content.includes("</h2>"))) {
    return content;
  }
  // Strip TOC
  let text = content.replace(/\[TOC\][\s\S]*?\[\/TOC\]\n*/g, "");

  // :::conseil/encadre blocks
  text = text.replace(/:::(conseil|encadre)\s+(.+?)\n([\s\S]*?):::/g, (_, type, title, body) => {
    const label = type === "conseil" ? "Le conseil du prof" : "Encadré";
    const emoji = type === "conseil" ? "🎓" : "📋";
    let cleanBody = body.trim();
    // Extract images
    const imgMatch = cleanBody.match(/\[IMAGE\]\((.*?)\)\{caption:(.*?)(?:\|layout:([\w-]+))?(?:\|size:(\d+))?\}/);
    if (imgMatch) {
      cleanBody = cleanBody.replace(imgMatch[0], "").trim();
      cleanBody += `<img src="${imgMatch[1]}" alt="${imgMatch[2]?.trim() || ""}" />`;
    }
    return `<div class="encadre-block encadre-${type}" data-type="${type}"><div class="encadre-header"><span>${emoji} ${label}</span></div><div class="encadre-body"><h4>${title.trim()}</h4><p>${cleanBody}</p></div></div>`;
  });

  // [IMAGE] blocks
  text = text.replace(/\[IMAGE\]\((.*?)\)\{caption:(.*?)(?:\|layout:([\w-]+))?(?:\|size:(\d+))?\}/g, (_, src, caption) => {
    return `<figure><img src="${src}" alt="${caption?.trim() || ""}" />${caption?.trim() ? `<figcaption>${caption.trim()}</figcaption>` : ""}</figure>`;
  });

  const lines = text.split("\n");
  let html = "";
  let inList = false;
  let listType = "";

  const fmtInline = (s: string) => s
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");

  for (const line of lines) {
    const t = line.trim();
    if (!t) { if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; } continue; }
    if (t.startsWith("#### ")) { if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; } html += `<h4>${t.slice(5)}</h4>`; continue; }
    if (t.startsWith("### ")) { if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; } html += `<h3>${t.slice(4)}</h3>`; continue; }
    if (t.startsWith("## ")) { if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; } html += `<h2>${t.slice(3)}</h2>`; continue; }
    if (t.startsWith("> ")) { if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; } html += `<blockquote><p>${t.slice(2)}</p></blockquote>`; continue; }
    if (t.startsWith("- ")) {
      if (!inList || listType !== "ul") { if (inList) html += listType === "ul" ? "</ul>" : "</ol>"; html += "<ul>"; inList = true; listType = "ul"; }
      html += `<li>${fmtInline(t.slice(2))}</li>`; continue;
    }
    const numM = t.match(/^(\d+)[.)]\s*(.+)/);
    if (numM) {
      if (!inList || listType !== "ol") { if (inList) html += listType === "ul" ? "</ul>" : "</ol>"; html += "<ol>"; inList = true; listType = "ol"; }
      html += `<li>${fmtInline(numM[2])}</li>`; continue;
    }
    if (inList) { html += listType === "ul" ? "</ul>" : "</ol>"; inList = false; }
    if (t.startsWith("<")) html += t; else html += `<p>${fmtInline(t)}</p>`;
  }
  if (inList) html += listType === "ul" ? "</ul>" : "</ol>";
  return html;
};

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

  // Fetch author info
  const { data: authorInfo } = useQuery({
    queryKey: ["blog-author", article?.author],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_authors").select("*").eq("name", article!.author!).single();
      return data;
    },
    enabled: !!article?.author,
  });

  // Related articles (same category)
  const { data: relatedArticles } = useQuery({
    queryKey: ["related-articles", article?.category, article?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_articles")
        .select("id, slug, title, cover_image, category, published_at, author")
        .eq("category", article!.category!)
        .neq("id", article!.id)
        .order("published_at", { ascending: false })
        .limit(3);
      return data || [];
    },
    enabled: !!article?.category && !!article?.id,
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

  const estimateReadTime = (text: string) => Math.max(1, Math.round(text.replace(/<[^>]*>/g, "").split(/\s+/).length / 200));

  // Get HTML content (with legacy conversion)
  const articleHtml = useMemo(() => {
    if (!article) return "";
    let html = convertLegacyToHtml(article.content);
    return postProcessImages(html);
  }, [article]);

  const toc = useMemo(() => extractTocFromHtml(articleHtml), [articleHtml]);

  const getDisplayHtml = () => {
    if (!article) return "";
    const fullHtml = injectAnchors(articleHtml);
    if (article.is_free) return fullHtml;
    if (user && hasAccessToBlog) return fullHtml;
    // Truncate for paywall
    const cutoff = article.paywall_preview_length || 500;
    const textOnly = fullHtml.replace(/<[^>]*>/g, "");
    if (textOnly.length <= cutoff) return fullHtml;
    // Find a tag boundary near the cutoff
    let cut = fullHtml.indexOf("</p>", cutoff);
    if (cut === -1) cut = cutoff;
    else cut += 4;
    return fullHtml.substring(0, cut);
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
      author: { "@type": "Person", name: article.author || "Info Pêche" },
      publisher: { "@type": "Organization", name: "Info Pêche" },
      datePublished: article.published_at, dateModified: article.updated_at || article.published_at,
      mainEntityOfPage: window.location.href,
    });
    return () => { document.title = "Info Pêche"; scriptEl?.remove(); };
  }, [article]);

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
                  {/* Author bar */}
                  {authorInfo && (
                    <div className="flex items-center gap-3 mb-6 text-sm text-muted-foreground">
                      {authorInfo.photo_url && (
                        <img src={authorInfo.photo_url} alt={authorInfo.name} className="w-10 h-10 rounded-full object-cover" />
                      )}
                      <div>
                        <p className="font-medium text-foreground">{authorInfo.name}</p>
                        {authorInfo.description && <p className="text-xs">{authorInfo.description}</p>}
                      </div>
                      <span className="text-xs ml-auto">
                        {new Date(article.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    </div>
                  )}

                  {/* L'essentiel de l'article */}
                  {article.key_points && article.key_points.length > 0 && article.key_points.some((p: string) => p.trim()) && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mb-8 bg-primary/5 border border-primary/15 rounded-2xl p-6 md:p-8"
                    >
                      <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
                        <Info className="w-4 h-4" /> L'essentiel de l'article
                      </h2>
                      <ul className="space-y-3">
                        {(article.key_points as string[]).filter((p: string) => p.trim()).map((point: string, i: number) => (
                          <li key={i} className="flex gap-3 items-start text-[0.95rem] leading-relaxed text-foreground/85">
                            <span className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                            <span dangerouslySetInnerHTML={{ __html: point.replace(/\*\*(.*?)\*\*/g, "<strong class='text-foreground'>$1</strong>") }} />
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  {/* Excerpt / Chapeau */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mb-12">
                    <div className="flex gap-5">
                      <div className="hidden md:block w-1 bg-gradient-to-b from-primary via-primary/40 to-transparent rounded-full flex-shrink-0" />
                      <div>
                        <span className="inline-block text-[0.65rem] font-bold uppercase tracking-[0.25em] text-primary/70 mb-3 border border-primary/20 rounded-full px-3 py-0.5">Introduction</span>
                        <p className="text-lg md:text-[1.25rem] leading-[1.9] text-foreground/80 font-[Playfair_Display]">
                          {article.excerpt}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Mini-sommaire */}
                  {toc.length > 0 && !showPaywall && (
                    <motion.nav
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-muted/30 border border-border/50 rounded-2xl p-6 md:p-8 mb-12"
                    >
                      <h2 className="text-2xl font-bold text-foreground mb-5 font-[Playfair_Display]">
                        Mini-sommaire
                      </h2>
                      <ol className="space-y-2">
                        {toc.filter(t => t.level === 2).map((item, i) => (
                          <li key={i}>
                            <a
                              href={`#${item.anchor}`}
                              className="group flex items-center gap-3 text-[0.95rem] hover:text-primary transition-colors py-1"
                            >
                              <span className="text-primary font-bold text-sm w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                {i + 1}
                              </span>
                              <span className="group-hover:underline underline-offset-2 text-foreground font-medium">
                                {item.text}
                              </span>
                            </a>
                          </li>
                        ))}
                      </ol>
                    </motion.nav>
                  )}

                  {/* Article HTML content */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="article-html-content"
                    dangerouslySetInnerHTML={{ __html: getDisplayHtml() }}
                  />

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

                  {/* Related articles */}
                  {relatedArticles && relatedArticles.length > 0 && !showPaywall && (
                    <div className="mt-16 pt-10 border-t border-border">
                      <h2 className="text-2xl font-bold text-foreground mb-8 font-[Playfair_Display]">Articles similaires</h2>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {relatedArticles.map(ra => (
                          <Link key={ra.id} to={`/blog/${ra.slug}`} className="group block">
                            <div className="bg-card border border-border/50 rounded-xl overflow-hidden hover:shadow-lg transition-all">
                              <img
                                src={ra.cover_image || "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=400&h=250&fit=crop"}
                                alt={ra.title}
                                className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="p-4">
                                <p className="text-xs text-muted-foreground mb-1">
                                  {new Date(ra.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                                </p>
                                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 text-sm">
                                  {ra.title}
                                </h3>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
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
