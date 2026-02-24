import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Calendar, User, Clock, Crown, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SideCart from "@/components/SideCart";
import YouTubeSidebar from "@/components/YouTubeSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, hasAccessToBlog } = useAuth();

  const { data: article, isLoading } = useQuery({
    queryKey: ["blog-article", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_articles")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: relatedIssue } = useQuery({
    queryKey: ["related-issue", article?.related_issue_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("digital_issues")
        .select("youtube_video_url")
        .eq("id", article!.related_issue_id!)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!article?.related_issue_id,
  });

  const estimateReadTime = (text: string) => {
    const words = text.split(/\s+/).length;
    return Math.max(1, Math.round(words / 200));
  };

  const renderContent = (text: string, isFirst = true) => {
    let firstTextRendered = false;

    return text.split("\n\n").map((paragraph, i) => {
      // Image block: [IMAGE](url){caption:text}
      const imgMatch = paragraph.match(/^\[IMAGE\]\((.*?)\)\{caption:(.*?)\}$/);
      if (imgMatch) {
        return (
          <figure key={i} className="my-10 md:my-14 -mx-4 md:-mx-8 lg:-mx-16">
            <div className="overflow-hidden rounded-lg md:rounded-xl shadow-lg">
              <img
                src={imgMatch[1]}
                alt={imgMatch[2] || ""}
                className="w-full object-cover"
                loading="lazy"
              />
            </div>
            {imgMatch[2] && (
              <figcaption className="mt-3 px-4 md:px-0 text-sm text-muted-foreground italic text-center flex items-center justify-center gap-2">
                <span className="w-8 h-px bg-primary/40 inline-block" />
                {imgMatch[2]}
                <span className="w-8 h-px bg-primary/40 inline-block" />
              </figcaption>
            )}
          </figure>
        );
      }

      if (paragraph.startsWith("### ")) {
        return (
          <h3 key={i} className="text-xl md:text-2xl font-bold text-foreground mt-10 mb-4 font-[Playfair_Display]">
            {paragraph.replace("### ", "")}
          </h3>
        );
      }
      if (paragraph.startsWith("## ")) {
        return (
          <h2 key={i} className="text-2xl md:text-3xl font-bold text-foreground mt-14 mb-5 font-[Playfair_Display] border-l-4 border-primary pl-4">
            {paragraph.replace("## ", "")}
          </h2>
        );
      }
      if (paragraph.startsWith("- **") || paragraph.startsWith("- ")) {
        const items = paragraph.split("\n").filter(Boolean);
        return (
          <ul key={i} className="my-6 space-y-3 pl-0">
            {items.map((item, j) => (
              <li key={j} className="flex gap-3 items-start">
                <span className="mt-2 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                <span dangerouslySetInnerHTML={{
                  __html: item.replace(/^- /, "")
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(/\*(.*?)\*/g, "<em>$1</em>")
                }} />
              </li>
            ))}
          </ul>
        );
      }

      // Drop cap for first paragraph
      if (isFirst && !firstTextRendered && paragraph.trim().length > 50) {
        firstTextRendered = true;
        const firstLetter = paragraph.trim()[0];
        const rest = paragraph.trim().slice(1);
        return (
          <p key={i} className="my-5 text-lg leading-[1.85] text-foreground/85">
            <span className="float-left text-6xl font-bold font-[Playfair_Display] text-primary leading-[0.8] mr-3 mt-1">
              {firstLetter}
            </span>
            <span dangerouslySetInnerHTML={{
              __html: rest
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/\*(.*?)\*/g, "<em>$1</em>")
            }} />
          </p>
        );
      }

      // Detect pull-quote style (lines starting with >)
      if (paragraph.startsWith("> ")) {
        return (
          <blockquote key={i} className="my-10 py-6 px-8 border-l-4 border-primary bg-primary/5 rounded-r-xl text-lg italic text-foreground/80 font-[Playfair_Display]">
            {paragraph.replace(/^> /gm, "")}
          </blockquote>
        );
      }

      return (
        <p key={i} className="my-5 text-[1.1rem] leading-[1.85] text-foreground/85" dangerouslySetInnerHTML={{
          __html: paragraph
            .replace(/\*\*(.*?)\*\*/g, "<strong class='text-foreground font-semibold'>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
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
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(name.startsWith("og:") ? "property" : "name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta("description", article.excerpt.substring(0, 160));
    setMeta("og:title", article.title);
    setMeta("og:description", article.excerpt.substring(0, 160));
    setMeta("og:type", "article");
    if (article.cover_image) setMeta("og:image", article.cover_image);

    let scriptEl = document.querySelector('script[data-jsonld="article"]') as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement("script");
      scriptEl.type = "application/ld+json";
      scriptEl.setAttribute("data-jsonld", "article");
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.excerpt,
      image: article.cover_image || undefined,
      author: { "@type": "Organization", name: article.author || "Info Pêche" },
      publisher: { "@type": "Organization", name: "Info Pêche" },
      datePublished: article.published_at,
      dateModified: article.updated_at || article.published_at,
      mainEntityOfPage: window.location.href,
    });

    return () => {
      document.title = "Info Pêche";
      scriptEl?.remove();
    };
  }, [article]);

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
            <Link to="/blog">
              <Button variant="outline">Retour au blog</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Hero - Full-width immersive cover */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative w-full h-[55vh] md:h-[65vh] overflow-hidden"
            >
              <img
                src={article.cover_image || "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1200&h=600&fit=crop"}
                alt={article.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Title overlay */}
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-10 md:pb-16">
                <div className="container mx-auto max-w-4xl">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                  >
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
                      <span className="flex items-center gap-1.5">
                        <User className="h-4 w-4" /> {article.author}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {new Date(article.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" /> {estimateReadTime(article.content)} min de lecture
                      </span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Content area */}
            <div className="container mx-auto px-4 max-w-5xl py-10 md:py-16">
              <div className="grid lg:grid-cols-[1fr_280px] gap-12">
                {/* Article body */}
                <article>
                  {/* Excerpt / Chapeau */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-10 pb-8 border-b border-border"
                  >
                    <p className="text-xl md:text-2xl leading-relaxed text-foreground/70 font-[Playfair_Display] italic">
                      {article.excerpt}
                    </p>
                  </motion.div>

                  {/* Article content */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="article-body"
                  >
                    {renderContent(getDisplayContent())}
                  </motion.div>

                  {/* Paywall */}
                  {showPaywall && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="mt-8 relative"
                    >
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
                          <Button
                            size="lg"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-8"
                            onClick={() => { window.location.href = "/#subscribe"; }}
                          >
                            <Crown className="w-4 h-4 mr-2" /> Je m'abonne
                          </Button>
                          <Button
                            variant="outline"
                            size="lg"
                            className="rounded-full px-8"
                            onClick={() => navigate("/mon-compte")}
                          >
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
                  <div className="sticky top-28">
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
