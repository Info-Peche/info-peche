import { motion } from "framer-motion";
import { Check, ShoppingCart, Sparkles, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import magazineCover from "@/assets/magazine-cover-new.jpg";
import { useState } from "react";

const YOUTUBE_VIDEO_ID = "gwYLuVXP-Ik";

const LatestEdition = () => {
  const { addItem } = useCart();
  const [showVideo, setShowVideo] = useState(false);

  const features = [
    "Dossier spécial : Les amorces d'hiver",
    "Test matériel : 5 cannes au banc d'essai",
    "Reportage : Championnat du monde 2024",
    "Technique : La pêche à la grande canne expliquée",
  ];

  const product = {
    id: "mag-current",
    name: "Info-Pêche - Édition Actuelle",
    price: 6.90,
    image: magazineCover,
    description: "Le guide ultime pour réussir votre saison de pêche."
  };

  return (
    <section id="magazine" className="py-28 bg-background relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-secondary/60 to-transparent" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />

      <div className="container px-4 mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          <motion.div
            initial={{ opacity: 0, x: -50, rotate: -2 }}
            whileInView={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="flex-1 relative group w-full max-w-xl space-y-6"
          >
            {/* Video or cover */}
            {showVideo ? (
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-border/50 aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0`}
                  title="Info-Pêche - Feuilletez le dernier numéro"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            ) : (
              <div className="relative">
                {/* Glow behind cover */}
                <div className="absolute inset-4 bg-primary/15 blur-[60px] rounded-full group-hover:bg-primary/25 transition-all duration-700" />

                <div 
                  className="relative z-10 p-3 bg-card rounded-2xl shadow-2xl border border-border/50 group-hover:shadow-glow-primary transition-all duration-500 cursor-pointer"
                  onClick={() => setShowVideo(true)}
                >
                  <div className="relative">
                    <img
                      src={`https://img.youtube.com/vi/${YOUTUBE_VIDEO_ID}/maxresdefault.jpg`}
                      alt="Vidéo de présentation du magazine Info-Pêche"
                      className="w-full h-auto rounded-xl aspect-video object-cover"
                    />
                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 bg-primary/90 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                        <Play className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" />
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-lg font-medium">
                      ▶ Feuilletez le numéro en vidéo
                    </div>
                  </div>
                </div>

                {/* Floating badge */}
                <motion.div
                  animate={{ rotate: [10, 14, 10], y: [0, -4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-5 -right-5 z-20 bg-accent text-accent-foreground w-22 h-22 rounded-full flex items-center justify-center font-bold shadow-lg shadow-accent/30"
                >
                  <div className="text-center text-sm leading-tight p-4">
                    <Sparkles className="w-4 h-4 mx-auto mb-0.5" />
                    NOUVEAU
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="flex-1 space-y-8"
          >
            <div>
              <span className="inline-block py-1.5 px-4 rounded-full bg-primary/10 text-primary font-bold text-xs tracking-widest uppercase mb-5">
                Actuellement en kiosque
              </span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold mb-5 text-foreground leading-tight">
                L'Édition du Mois
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Plongez au cœur de l'action avec notre dernier numéro. Des articles exclusifs rédigés par les plus grands champions, des tests impartiaux et des secrets bien gardés.
              </p>
            </div>

            <div className="space-y-3">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.08 }}
                  viewport={{ once: true }}
                  className="flex items-center space-x-3 p-3.5 bg-secondary/70 rounded-xl hover:bg-secondary transition-colors group/item"
                >
                  <div className="bg-primary text-primary-foreground p-1.5 rounded-full shrink-0 group-hover/item:scale-110 transition-transform">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-foreground font-medium">{feature}</span>
                </motion.div>
              ))}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Button
                size="lg"
                className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-10 py-6 text-lg shadow-xl hover:scale-105 transition-all duration-300"
                onClick={() => addItem(product)}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Acheter ce numéro — 6,90€
              </Button>
              <span className="text-sm text-muted-foreground">
                Livraison gratuite en France
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LatestEdition;
