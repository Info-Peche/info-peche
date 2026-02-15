import { motion } from "framer-motion";
import { ShoppingBag, Monitor, Package, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider, useCart } from "@/context/CartContext";
import SideCart from "@/components/SideCart";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const ShopContent = () => {
  const { addItem } = useCart();

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
    addItem({
      id: `digital-${issue.id}`,
      name: `Info Pêche ${issue.issue_number} (Numérique)`,
      price: (issue.price_cents || 300) / 100,
      image: issue.cover_image || undefined,
      description: issue.title,
    });
  };

  return (
    <main className="pt-28 pb-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <span className="inline-block py-1.5 px-4 rounded-full bg-primary/10 text-primary font-bold text-xs tracking-widest uppercase mb-5">
            Archives
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Anciens Numéros
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Retrouvez tous les anciens numéros d'Info Pêche. Chaque magazine est une mine d'informations pour progresser.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[420px] rounded-2xl" />
            ))}
          </div>
        ) : !issues || issues.length === 0 ? (
          <div className="text-center py-20">
            <AlertCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">Aucun ancien numéro disponible pour le moment.</p>
            <p className="text-sm text-muted-foreground mt-2">Revenez bientôt, nous ajoutons régulièrement de nouvelles archives.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {issues.map((issue, index) => {
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
                    <div className="relative overflow-hidden">
                      <img
                        src={issue.cover_image || "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=400&h=550&fit=crop"}
                        alt={issue.title}
                        className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-foreground text-xs font-bold shadow-sm">
                          <Monitor className="w-3 h-3 mr-1" /> En ligne
                        </Badge>
                        {hasPhysical && (
                          <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-foreground text-xs font-bold shadow-sm">
                            <Package className="w-3 h-3 mr-1" /> Papier
                          </Badge>
                        )}
                      </div>
                      {!hasPhysical && issue.physical_stock !== null && (
                        <div className="absolute top-3 right-3">
                          <Badge variant="destructive" className="text-xs">Épuisé en papier</Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-5 flex flex-col flex-1">
                      <p className="text-xs text-muted-foreground font-medium mb-1">{issue.issue_number}</p>
                      <h2 className="text-lg font-serif font-bold text-foreground mb-2">{issue.title}</h2>
                      <p className="text-sm text-muted-foreground mb-5 flex-1 line-clamp-3">{issue.description}</p>
                      
                      <div className="space-y-2.5 mt-auto">
                        {/* Digital button - always available */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full rounded-full border-primary/30 text-primary hover:bg-primary/5"
                          onClick={() => handleAddDigital(issue)}
                        >
                          <Monitor className="h-4 w-4 mr-2" />
                          Lire en ligne — {digitalPrice.toFixed(2)}€
                        </Button>
                        
                        {/* Physical button - only if in stock */}
                        {hasPhysical && (
                          <Button
                            size="sm"
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                            onClick={() => handleAddPhysical(issue)}
                          >
                            <ShoppingBag className="h-4 w-4 mr-2" />
                            Commander en papier — {physicalPrice.toFixed(2)}€
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
    <CartProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <SideCart />
        <ShopContent />
        <Footer />
      </div>
    </CartProvider>
  );
};

export default Shop;
