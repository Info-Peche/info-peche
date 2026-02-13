import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider, useCart } from "@/context/CartContext";
import SideCart from "@/components/SideCart";

interface BackIssue {
  id: string;
  title: string;
  issue: string;
  price: number;
  image: string;
  description: string;
}

const backIssues: BackIssue[] = [
  {
    id: "ip-120",
    title: "Spécial Compétition",
    issue: "N°120 — Janvier 2026",
    price: 6.90,
    image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=400&h=550&fit=crop",
    description: "Dossier complet sur les stratégies de compétition, interviews des champions et tests matériel.",
  },
  {
    id: "ip-119",
    title: "Les canaux en hiver",
    issue: "N°119 — Décembre 2025",
    price: 6.90,
    image: "https://images.unsplash.com/photo-1504309092620-4d0ec726efa4?w=400&h=550&fit=crop",
    description: "Techniques hivernales, montages fins et amorces spéciales pour les canaux en eau froide.",
  },
  {
    id: "ip-118",
    title: "Spécial Étangs",
    issue: "N°118 — Novembre 2025",
    price: 6.90,
    image: "https://images.unsplash.com/photo-1472396961693-142e6e269027?w=400&h=550&fit=crop",
    description: "Tout savoir sur la pêche en étang : choix du poste, amorçage et gestion de la partie de pêche.",
  },
  {
    id: "ip-117",
    title: "Rivières sauvages",
    issue: "N°117 — Octobre 2025",
    price: 6.90,
    image: "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=400&h=550&fit=crop",
    description: "Reportage exclusif sur les plus belles rivières françaises pour la pêche au coup.",
  },
  {
    id: "ip-116",
    title: "Guide du débutant",
    issue: "N°116 — Septembre 2025",
    price: 6.90,
    image: "https://images.unsplash.com/photo-1485833077787-4535e3f31b1a?w=400&h=550&fit=crop",
    description: "Le numéro idéal pour commencer : matériel, techniques de base et premiers pas au bord de l'eau.",
  },
  {
    id: "ip-115",
    title: "Spécial été",
    issue: "N°115 — Juillet 2025",
    price: 5.90,
    image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=400&h=550&fit=crop",
    description: "Les meilleures techniques estivales, pêche de nuit et gros poissons de saison.",
  },
];

const ShopContent = () => {
  const { addItem, setIsOpen } = useCart();

  const handleAddToCart = (issue: BackIssue) => {
    addItem({
      id: issue.id,
      name: `Info Pêche ${issue.issue}`,
      price: issue.price,
    });
    setIsOpen(true);
  };

  return (
    <main className="pt-28 pb-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Boutique — Anciens Numéros
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Retrouvez tous les anciens numéros d'Info Pêche. Chaque magazine est une mine d'informations pour progresser.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {backIssues.map((issue, index) => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Card className="group overflow-hidden border-border/50 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                <div className="relative overflow-hidden">
                  <img
                    src={issue.image}
                    alt={issue.title}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-5 flex flex-col flex-1">
                  <p className="text-xs text-muted-foreground font-medium mb-1">{issue.issue}</p>
                  <h2 className="text-lg font-bold text-foreground mb-2">{issue.title}</h2>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">{issue.description}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xl font-bold text-primary">{issue.price.toFixed(2)}€</span>
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-5"
                      onClick={() => handleAddToCart(issue)}
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" /> Ajouter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
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
