import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, Monitor, Package, AlertCircle, BookOpen, Truck, Eye, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import SideCart from "@/components/SideCart";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

type ViewMode = "online" | "physical";

const extractYear = (title: string): string => {
  const match = title.match(/(\d{4})/);
  return match ? match[1] : "Autre";
};

const ShopContent = () => {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("online");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  const { data: issues, isLoading } = useQuery({
    queryKey: ["archived-issues"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("digital_issues")
        .select("*")
        .eq("is_archived", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Extract available years from issues
  const availableYears = useMemo(() => {
    if (!issues) return [];
    const years = [...new Set(issues.map((i) => extractYear(i.title)))].sort((a, b) => b.localeCompare(a));
    return years;
  }, [issues]);

  const filteredIssues = useMemo(() => {
    let filtered = issues || [];
    if (viewMode === "physical") {
      filtered = filtered.filter((issue) => issue.physical_stock !== null && issue.physical_stock > 0);
    }
    if (selectedYear !== "all") {
      filtered = filtered.filter((issue) => extractYear(issue.title) === selectedYear);
    }
    return filtered;
  }, [issues, viewMode, selectedYear]);

  const handleAddPhysical = (issue: any) => {
    addItem({
      id: `physical-${issue.id}`,
      name: `Info Pêche ${issue.issue_number} (Papier)`,
      price: (issue.physical_price_cents || 500) / 100,
      image: issue.cover_image || undefined,
      description: issue.title,
    });
  };

  const handleAddDigital = (issue: any) => {
    // Navigate to preview viewer instead of adding to cart directly
    navigate(`/lire?issue=${issue.id}&mode=preview`);
  };

  return (
    <main className="pt-28 pb-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span className="inline-block py-1.5 px-4 rounded-full bg-primary/10 text-primary font-bold text-xs tracking-widest uppercase mb-5">
            Archives
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Retrouvez tous les anciens numéros
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Chaque magazine est une mine d'informations pour progresser. Choisissez votre format préféré.
          </p>

          {/* Split toggle */}
          <div className="inline-flex bg-secondary rounded-full p-1.5 gap-1">
            <button
              onClick={() => setViewMode("online")}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 ${
                viewMode === "online"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Consultez en ligne
            </button>
            <button
              onClick={() => setViewMode("physical")}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 ${
                viewMode === "physical"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Truck className="w-4 h-4" />
              Livraison à domicile
            </button>
           </div>

          {/* Year filter */}
          {availableYears.length > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <button
                onClick={() => setSelectedYear("all")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedYear === "all"
                    ? "bg-foreground text-background shadow"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                Tous
              </button>
              {availableYears.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedYear === year
                      ? "bg-foreground text-background shadow"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[420px] rounded-2xl" />
            ))}
          </div>
        ) : !filteredIssues || filteredIssues.length === 0 ? (
          <div className="text-center py-20">
            <AlertCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              {viewMode === "physical"
                ? "Aucun ancien numéro disponible en stock papier pour le moment."
                : "Aucun ancien numéro disponible pour le moment."}
            </p>
            <p className="text-sm text-muted-foreground mt-2">Revenez bientôt, nous ajoutons régulièrement de nouvelles archives.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {filteredIssues.map((issue, index) => {
              const hasPhysical = issue.physical_stock !== null && issue.physical_stock > 0;
              const physicalPrice = (issue.physical_price_cents || 500) / 100;
              const digitalPrice = (issue.price_cents || 300) / 100;

              return (
                <motion.div
                  key={issue.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <Card className="group overflow-hidden border-border/50 hover:shadow-xl transition-all duration-300 h-full flex flex-col rounded-2xl">
                    <div className="relative overflow-hidden bg-muted/30 flex items-center justify-center p-4">
                      <img
                        src={issue.cover_image || "https://fokaikipfikcokjwyeka.supabase.co/storage/v1/object/public/magazine-covers/ip100-cover.png"}
                        alt={issue.title}
                        className="w-auto h-72 object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-500 rounded-sm"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-foreground text-xs font-bold shadow-sm">
                          {viewMode === "online" ? (
                            <><Monitor className="w-3 h-3 mr-1" /> En ligne</>
                          ) : (
                            <><Package className="w-3 h-3 mr-1" /> Papier</>
                          )}
                        </Badge>
                      </div>
                      {viewMode === "physical" && hasPhysical && issue.physical_stock! <= 15 && (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-destructive text-destructive-foreground text-xs font-bold shadow-sm animate-pulse">
                            Plus que {issue.physical_stock} en stock !
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-5 flex flex-col flex-1">
                      <h2 className="text-lg font-serif font-bold text-foreground mb-2">
                        {issue.title.replace(/^Info Pêche\s*/i, '').replace(/^n°/i, 'N°')}
                      </h2>
                      <p className="text-sm text-muted-foreground mb-5 flex-1 line-clamp-3">{issue.description}</p>
                      
                      <div className="mt-auto">
                        {viewMode === "online" ? (
                          <Button
                            size="sm"
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                            onClick={() => handleAddDigital(issue)}
                          >
                            <BookOpen className="h-4 w-4 mr-2" />
                            Consulter le magazine
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                            onClick={() => handleAddPhysical(issue)}
                          >
                            <ShoppingBag className="h-4 w-4 mr-2" />
                            Commander — {physicalPrice.toFixed(2)}€
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

const Shop = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SideCart />
      <ShopContent />
      <Footer />
    </div>
  );
};

export default Shop;
