import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import SideCart from "@/components/SideCart";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  date: string;
  readTime: string;
  isFree: boolean;
}

const articles: Article[] = [
  {
    id: "technique-amorce-riviere",
    title: "Les secrets d'une amorce réussie en rivière",
    excerpt: "Découvrez les mélanges et techniques qui font la différence pour attirer les poissons en courant. De la granulométrie au taux d'humidité, chaque détail compte pour une amorce qui tient le coup face au courant…",
    image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=600&h=400&fit=crop",
    category: "Technique",
    date: "10 Fév 2026",
    readTime: "8 min",
    isFree: true,
  },
  {
    id: "competition-championnat-france",
    title: "Retour sur le Championnat de France 2025",
    excerpt: "Revivez les moments forts de la compétition qui a sacré les meilleurs pêcheurs au coup de l'Hexagone. Stratégies gagnantes, postes clés et interviews exclusives des champions…",
    image: "https://images.unsplash.com/photo-1504309092620-4d0ec726efa4?w=600&h=400&fit=crop",
    category: "Compétition",
    date: "5 Fév 2026",
    readTime: "12 min",
    isFree: false,
  },
  {
    id: "materiel-cannes-2026",
    title: "Comparatif : les meilleures cannes au coup 2026",
    excerpt: "Nous avons testé 15 cannes des plus grandes marques pour vous aider à faire le bon choix. Poids, équilibre, rigidité, rapport qualité-prix : notre verdict complet…",
    image: "https://images.unsplash.com/photo-1485833077787-4535e3f31b1a?w=600&h=400&fit=crop",
    category: "Matériel",
    date: "28 Jan 2026",
    readTime: "10 min",
    isFree: false,
  },
  {
    id: "debutant-peche-au-coup",
    title: "Débuter la pêche au coup : le guide complet",
    excerpt: "Tout ce qu'il faut savoir pour bien commencer : matériel de base, montages simples, choix du poste et premières techniques d'amorçage. Un article pensé pour les néophytes qui veulent progresser rapidement…",
    image: "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=600&h=400&fit=crop",
    category: "Débutant",
    date: "20 Jan 2026",
    readTime: "15 min",
    isFree: true,
  },
  {
    id: "reportage-etang-mythique",
    title: "Reportage : 48h sur un étang mythique du Morvan",
    excerpt: "Notre équipe a passé deux jours sur l'un des plans d'eau les plus réputés de France. Entre pêche de nuit, prises exceptionnelles et rencontres avec les locaux…",
    image: "https://images.unsplash.com/photo-1472396961693-142e6e269027?w=600&h=400&fit=crop",
    category: "Reportage",
    date: "15 Jan 2026",
    readTime: "20 min",
    isFree: false,
  },
];

const categoryColors: Record<string, string> = {
  Technique: "bg-primary/10 text-primary",
  Compétition: "bg-accent/20 text-accent-foreground",
  Matériel: "bg-nature/10 text-nature",
  Débutant: "bg-blue-100 text-blue-700",
  Reportage: "bg-purple-100 text-purple-700",
};

const Blog = () => {
  return (
    <CartProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <SideCart />

        <main className="pt-28 pb-20">
          <div className="container mx-auto px-4">
            {/* Page Header */}
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
                Certains articles sont en accès libre, d'autres sont réservés à nos abonnés.
              </p>
            </motion.div>

            {/* Articles Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={`/blog/${article.id}`}>
                    <Card className="group overflow-hidden border-border/50 hover:shadow-xl transition-all duration-300 h-full">
                      <div className="relative overflow-hidden">
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${categoryColors[article.category] || "bg-muted text-muted-foreground"}`}>
                            {article.category}
                          </span>
                        </div>
                        {!article.isFree && (
                          <div className="absolute top-3 right-3 bg-foreground/80 text-background p-1.5 rounded-full">
                            <Lock className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                          <span>{article.date}</span>
                          <span>•</span>
                          <span>{article.readTime} de lecture</span>
                        </div>
                        <h2 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {article.title}
                        </h2>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {article.excerpt}
                        </p>
                        <div className="mt-4 flex items-center text-sm font-semibold text-primary">
                          {article.isFree ? "Lire l'article" : "Lire l'extrait"}
                          <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </CartProvider>
  );
};

export default Blog;
