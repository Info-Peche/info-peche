import { useState, useMemo } from "react";
import { usePageSeo } from "@/hooks/usePageSeo";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Calendar, User, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SideCart from "@/components/SideCart";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const CATEGORIES = ["Tous", "Technique", "Compétition", "Matériel", "Débutant", "Reportage", "Famille"];
const ARTICLES_PER_PAGE = 12;

const categoryColors: Record<string, string> = {
  Technique: "bg-primary/10 text-primary",
  Compétition: "bg-accent/20 text-accent-foreground",
  Matériel: "bg-primary/5 text-primary",
  Débutant: "bg-secondary text-foreground",
  Reportage: "bg-muted text-muted-foreground",
  Famille: "bg-accent/10 text-accent-foreground",
};

const Blog = () => {
  usePageSeo({
    title: "Blog Pêche au Coup — Techniques, Matériel & Compétitions | Info Pêche",
    description: "Articles et conseils de pêche au coup : techniques, tests de matériel, reportages compétition et guides pour débutants. Le blog du magazine Info Pêche.",
    canonical: "/blog",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: articles, isLoading } = useQuery({
    queryKey: ["blog-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_articles")
        .select("id, slug, title, excerpt, cover_image, category, is_free, author, published_at, is_featured, display_order")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Reset page when filters change
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  // Featured article: the one marked is_featured (first one if multiple)
  const featuredArticle = useMemo(() => {
    if (!articles) return null;
    return articles.find(a => a.is_featured) || null;
  }, [articles]);

  // Filtered + sorted articles (excluding featured from list)
  const filtered = useMemo(() => {
    if (!articles) return [];
    return articles
      .filter(a => {
        // Exclude the featured article from the grid
        if (featuredArticle && a.id === featuredArticle.id) return false;
        const matchesCategory = selectedCategory === "Tous" || a.category === selectedCategory;
        const matchesSearch = !searchQuery ||
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (a.author && a.author.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        // Articles with display_order come first, sorted by display_order ASC
        if (a.display_order != null && b.display_order != null) return a.display_order - b.display_order;
        if (a.display_order != null) return -1;
        if (b.display_order != null) return 1;
        // Then by published_at DESC
        return new Date(b.published_at!).getTime() - new Date(a.published_at!).getTime();
      });
  }, [articles, searchQuery, selectedCategory, featuredArticle]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / ARTICLES_PER_PAGE);
  const paginatedArticles = filtered.slice((currentPage - 1) * ARTICLES_PER_PAGE, currentPage * ARTICLES_PER_PAGE);

  // Show featured only on page 1 without filters
  const showFeatured = featuredArticle && currentPage === 1 && selectedCategory === "Tous" && !searchQuery;

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

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
            className="text-center mb-10"
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

          {/* Search & Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-10 space-y-4"
          >
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Rechercher un article, un thème, un auteur..."
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button onClick={() => handleSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
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
              {/* Featured Article */}
              {showFeatured && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mb-14"
                >
                  <Link to={`/blog/${featuredArticle.slug}`}>
                    <div className="group relative overflow-hidden rounded-2xl shadow-xl h-[350px] md:h-[450px]">
                      <img
                        src={featuredArticle.cover_image || "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1200&h=600&fit=crop"}
                        alt={featuredArticle.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                            À la une
                          </span>
                          <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                            {featuredArticle.category}
                          </span>
                          {!featuredArticle.is_free && (
                            <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                              <Lock className="h-3 w-3" /> Premium
                            </span>
                          )}
                        </div>
                        <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 font-[Playfair_Display] leading-tight max-w-3xl">
                          {featuredArticle.title}
                        </h2>
                        <p className="text-white/70 text-sm md:text-base max-w-2xl line-clamp-2 mb-4">
                          {featuredArticle.excerpt}
                        </p>
                        <div className="flex items-center gap-4 text-white/60 text-sm">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            {new Date(featuredArticle.published_at!).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <User className="h-4 w-4" /> {featuredArticle.author}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )}

              {/* Articles Grid */}
              {paginatedArticles.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {paginatedArticles.map((article, index) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + index * 0.05 }}
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
                              <span>{new Date(article.published_at!).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
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

              {filtered.length === 0 && !showFeatured && (
                <p className="text-center text-muted-foreground py-12">
                  {searchQuery || selectedCategory !== "Tous"
                    ? "Aucun article trouvé pour cette recherche."
                    : "Aucun article pour le moment."}
                </p>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="flex items-center justify-center gap-2 mt-16" aria-label="Pagination du blog">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Précédent</span>
                  </Button>

                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, idx) =>
                      page === "ellipsis" ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">…</span>
                      ) : (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="min-w-[36px]"
                        >
                          {page}
                        </Button>
                      )
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="gap-1"
                  >
                    <span className="hidden sm:inline">Suivant</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </nav>
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
