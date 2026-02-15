import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Calendar, User, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import SideCart from "@/components/SideCart";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { PRODUCTS } from "@/lib/products";
import { toast } from "@/hooks/use-toast";

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
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

  const renderContent = (text: string) => {
    return text.split("\n\n").map((paragraph, i) => {
      if (paragraph.startsWith("## ")) {
        return <h2 key={i} className="text-2xl font-bold text-foreground mt-8 mb-4">{paragraph.replace("## ", "")}</h2>;
      }
      if (paragraph.startsWith("- **") || paragraph.startsWith("- ")) {
        const items = paragraph.split("\n").filter(Boolean);
        return (
          <ul key={i} className="list-disc pl-6 space-y-2 my-4">
            {items.map((item, j) => (
              <li key={j} dangerouslySetInnerHTML={{ __html: item.replace(/^- /, "").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
            ))}
          </ul>
        );
      }
      return <p key={i} className="my-4" dangerouslySetInnerHTML={{ __html: paragraph.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />;
    });
  };

  const getDisplayContent = () => {
    if (!article) return "";
    if (article.is_free) return article.content;
    // For paywall articles, show only up to the paywall_preview_length
    const cutoff = article.paywall_preview_length || 500;
    // Find a good cut point (end of paragraph)
    const content = article.content;
    let cut = content.indexOf("\n\n", cutoff);
    if (cut === -1) cut = cutoff;
    return content.substring(0, cut);
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <Header />
        <SideCart />

        <main className="pt-24 pb-20">
          {isLoading ? (
            <div className="container mx-auto px-4 max-w-3xl pt-20">
              <Skeleton className="h-64 w-full rounded-xl mb-8" />
              <Skeleton className="h-10 w-3/4 mb-4" />
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
              <div className="w-full h-64 md:h-96 overflow-hidden">
                <img
                  src={article.cover_image || "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1200&h=600&fit=crop"}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <article className="container mx-auto px-4 max-w-3xl -mt-16 relative">
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
                  {!article.is_free && (
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
                        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                          Cet article complet est disponible dans votre magazine Info Pêche.
                        </p>

                        <div className="max-w-xs mx-auto mb-5">
                          <Input
                            type="email"
                            placeholder="Votre email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="text-center"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <Button
                            className="bg-primary hover:bg-primary/90 text-white font-bold rounded-full px-6"
                            onClick={() => handleDigitalPurchase("single_issue")}
                            disabled={purchasing}
                          >
                            {purchasing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BookOpen className="w-4 h-4 mr-2" />}
                            Lire en ligne — {PRODUCTS.lectureNumero.price}€
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-full px-6"
                            onClick={() => { window.location.href = "/#subscribe"; }}
                          >
                            S'abonner
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">
                          ou accédez à tous les anciens numéros avec le{" "}
                          <button
                            onClick={() => handleDigitalPurchase("pass_15_days")}
                            className="text-primary font-medium underline cursor-pointer disabled:opacity-50"
                            disabled={purchasing}
                          >
                            Pass 15 jours — {PRODUCTS.pass15jours.price}€
                          </button>
                        </p>
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
            </>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default BlogArticle;
