import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Calendar, User, BookOpen, Loader2, LogIn, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SideCart from "@/components/SideCart";
import YouTubeSidebar from "@/components/YouTubeSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { PRODUCTS } from "@/lib/products";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, hasAccessToBlog } = useAuth();
  const [email, setEmail] = useState("");
  const [purchasing, setPurchasing] = useState(false);

  const handleDigitalPurchase = async (accessType: "single_issue" | "pass_15_days") => {
    if (!email) {
      toast({ title: "Email requis", description: "Entrez votre email pour continuer.", variant: "destructive" });
      return;
    }
    setPurchasing(true);
    try {
      const priceId = accessType === "single_issue" ? PRODUCTS.lectureNumero.price_id : PRODUCTS.pass15jours.price_id;
      const { data, error } = await supabase.functions.invoke("create-digital-checkout", {
        body: {
          email,
          price_id: priceId,
          issue_id: article?.related_issue_id || null,
          access_type: accessType,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de créer la session de paiement.", variant: "destructive" });
    } finally {
      setPurchasing(false);
    }
  };

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

  // Fetch the related issue to get youtube_video_url
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

  const renderContent = (text: string) => {
    return text.split("\n\n").map((paragraph, i) => {
      // Image block: [IMAGE](url){caption:text}
      const imgMatch = paragraph.match(/^\[IMAGE\]\((.*?)\)\{caption:(.*?)\}$/);
      if (imgMatch) {
        return (
          <figure key={i} className="my-8">
            <img src={imgMatch[1]} alt={imgMatch[2] || ""} className="w-full rounded-lg" loading="lazy" />
            {imgMatch[2] && <figcaption className="text-sm text-muted-foreground text-center mt-2 italic">{imgMatch[2]}</figcaption>}
          </figure>
        );
      }
      if (paragraph.startsWith("### ")) {
        return <h3 key={i} className="text-xl font-bold text-foreground mt-6 mb-3">{paragraph.replace("### ", "")}</h3>;
      }
      if (paragraph.startsWith("## ")) {
        return <h2 key={i} className="text-2xl font-bold text-foreground mt-8 mb-4">{paragraph.replace("## ", "")}</h2>;
      }
      if (paragraph.startsWith("- **") || paragraph.startsWith("- ")) {
        const items = paragraph.split("\n").filter(Boolean);
        return (
          <ul key={i} className="list-disc pl-6 space-y-2 my-4">
            {items.map((item, j) => (
              <li key={j} dangerouslySetInnerHTML={{ __html: item.replace(/^- /, "").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>") }} />
            ))}
          </ul>
        );
      }
      return <p key={i} className="my-4" dangerouslySetInnerHTML={{ __html: paragraph.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>") }} />;
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

  // SEO: Update document head
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

    // JSON-LD
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
    <>
      <div className="min-h-screen bg-background">
        <Header />
        <SideCart />

        <main className="pt-24 pb-20">
          {isLoading ? (
            <div className="container mx-auto px-4 max-w-5xl pt-20">
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <Skeleton className="h-64 w-full rounded-xl mb-8" />
                  <Skeleton className="h-10 w-3/4 mb-4" />
                  <Skeleton className="h-6 w-1/2 mb-8" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <div>
                  <Skeleton className="h-48 w-full rounded-xl mb-4" />
                  <Skeleton className="h-32 w-full rounded-xl" />
                </div>
              </div>
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
              <div className="w-full h-64 md:h-96 overflow-hidden">
                <img
                  src={article.cover_image || "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1200&h=600&fit=crop"}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="container mx-auto px-4 max-w-5xl -mt-16 relative">
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Article content */}
                  <article className="lg:col-span-2">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card rounded-2xl shadow-xl p-8 md:p-12"
                    >
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-6">
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold text-xs">
                          {article.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(article.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" /> {article.author}
                        </span>
                      </div>

                      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8 leading-tight">
                        {article.title}
                      </h1>

                      <div className="prose prose-lg max-w-none text-foreground/85 leading-relaxed">
                        {renderContent(getDisplayContent())}
                      </div>

                      {/* Paywall CTA */}
                      {showPaywall && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="mt-12 relative"
                        >
                          <div className="absolute -top-20 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent" />
                          <div className="bg-muted rounded-xl p-8 text-center border border-border">
                            <Lock className="h-8 w-8 text-primary mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-foreground mb-2">
                              Envie de lire la suite ?
                            </h3>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                              Cet article est réservé aux abonnés Info Pêche (formule 1 an ou 2 ans).
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
                              <Button
                                className="bg-primary hover:bg-primary/90 text-white font-bold rounded-full px-6"
                                onClick={() => { window.location.href = "/#subscribe"; }}
                              >
                                <Crown className="w-4 h-4 mr-2" />
                                Je m'abonne
                              </Button>
                              <Button
                                variant="outline"
                                className="rounded-full px-6"
                                onClick={() => navigate("/mon-compte")}
                              >
                                <LogIn className="w-4 h-4 mr-2" />
                                Je me connecte
                              </Button>
                            </div>

                          </div>
                        </motion.div>
                      )}

                      <div className="mt-10 pt-6 border-t border-border">
                        <Link to="/blog" className="inline-flex items-center text-primary font-medium hover:underline">
                          <ArrowLeft className="mr-2 h-4 w-4" /> Retour au blog
                        </Link>
                      </div>
                    </motion.div>
                  </article>

                  {/* Sidebar */}
                  <aside className="lg:col-span-1">
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
    </>
  );
};

export default BlogArticle;
