import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import SideCart from "@/components/SideCart";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

const categoryColors: Record<string, string> = {
  Technique: "bg-primary/10 text-primary",
  Compétition: "bg-accent/20 text-accent-foreground",
  Matériel: "bg-primary/5 text-primary",
  Débutant: "bg-secondary text-foreground",
  Reportage: "bg-muted text-muted-foreground",
  Famille: "bg-accent/10 text-accent-foreground",
};

const Blog = () => {
  const { data: articles, isLoading } = useQuery({
    queryKey: ["blog-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_articles")
        .select("id, slug, title, excerpt, cover_image, category, is_free, author, published_at")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <div className="min-h-screen bg-background">
        <Header />
        <SideCart />

        <main className="pt-28 pb-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-16"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Le Blog Info Pêche
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Techniques, reportages, tests matériel et actualités du monde de la pêche au coup.
                Certains articles sont en accès libre, d'autres sont réservés à nos lecteurs.
              </p>
            </motion.div>

            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-52 w-full rounded-xl" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {articles?.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link to={`/blog/${article.slug}`}>
                      <Card className="group overflow-hidden border-border/50 hover:shadow-xl transition-all duration-300 h-full">
                        <div className="relative overflow-hidden">
                          <img
                            src={article.cover_image || "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=600&h=400&fit=crop"}
                            alt={article.title}
                            className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-3 left-3 flex gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${categoryColors[article.category || ""] || "bg-muted text-muted-foreground"}`}>
                              {article.category}
                            </span>
                          </div>
                          {!article.is_free && (
                            <div className="absolute top-3 right-3 bg-foreground/80 text-background p-1.5 rounded-full">
                              <Lock className="h-3.5 w-3.5" />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-5">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                            <span>{new Date(article.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
                            <span>•</span>
                            <span>{article.author}</span>
                          </div>
                          <h2 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                            {article.title}
                          </h2>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {article.excerpt}
                          </p>
                          <div className="mt-4 flex items-center text-sm font-semibold text-primary">
                            {article.is_free ? "Lire l'article" : "Lire l'extrait"}
                            <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            {!isLoading && (!articles || articles.length === 0) && (
              <p className="text-center text-muted-foreground py-12">Aucun article pour le moment.</p>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Blog;
