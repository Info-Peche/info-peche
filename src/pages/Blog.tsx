import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Calendar, User } from "lucide-react";
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

  const featured = articles?.[0];
  const rest = articles?.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SideCart />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <span className="text-primary font-semibold text-sm uppercase tracking-widest">Le Blog</span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mt-2 mb-4 font-[Playfair_Display]">
              Info Pêche Magazine
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Techniques, reportages, tests matériel et actualités du monde de la pêche au coup.
            </p>
            <div className="w-16 h-1 bg-primary mx-auto mt-6 rounded-full" />
          </motion.div>

          {isLoading ? (
            <div className="space-y-8">
              <Skeleton className="h-[400px] w-full rounded-2xl" />
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-52 w-full rounded-xl" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Featured article - hero card */}
              {featured && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-14"
                >
                  <Link to={`/blog/${featured.slug}`}>
                    <div className="group relative overflow-hidden rounded-2xl shadow-xl h-[350px] md:h-[450px]">
                      <img
                        src={featured.cover_image || "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1200&h=600&fit=crop"}
                        alt={featured.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                            {featured.category}
                          </span>
                          {!featured.is_free && (
                            <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                              <Lock className="h-3 w-3" /> Premium
                            </span>
                          )}
                        </div>
                        <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 font-[Playfair_Display] leading-tight max-w-3xl">
                          {featured.title}
                        </h2>
                        <p className="text-white/70 text-sm md:text-base max-w-2xl line-clamp-2 mb-4">
                          {featured.excerpt}
                        </p>
                        <div className="flex items-center gap-4 text-white/60 text-sm">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            {new Date(featured.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <User className="h-4 w-4" /> {featured.author}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )}

              {/* Articles grid */}
              {rest && rest.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {rest.map((article, index) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + index * 0.08 }}
                    >
                      <Link to={`/blog/${article.slug}`} className="group block h-full">
                        <div className="bg-card border border-border/50 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col">
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
                          <div className="p-5 flex flex-col flex-1">
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                              <span>{new Date(article.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
                              <span>•</span>
                              <span>{article.author}</span>
                            </div>
                            <h2 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2 font-[Playfair_Display]">
                              {article.title}
                            </h2>
                            <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                              {article.excerpt}
                            </p>
                            <div className="mt-4 flex items-center text-sm font-semibold text-primary">
                              {article.is_free ? "Lire l'article" : "Lire l'extrait"}
                              <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}

              {(!articles || articles.length === 0) && (
                <p className="text-center text-muted-foreground py-12">Aucun article pour le moment.</p>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
