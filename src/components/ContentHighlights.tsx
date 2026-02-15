import { motion } from "framer-motion";
import { ArrowRight, Monitor, Truck, BookOpen, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import magazineCover from "@/assets/magazine-cover-new.jpg";

const BackIssuesSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/40 via-transparent to-primary/5" />

      <div className="container px-4 mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-bold tracking-widest uppercase text-sm">
            Archives
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mt-2 mb-4 text-foreground">
            Retrouvez tous les anciens numéros
          </h2>
          <p className="text-muted-foreground text-lg">
            Consultez-les en ligne immédiatement ou recevez-les chez vous — chaque numéro est une mine d'or pour progresser.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Digital / Online */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="group"
          >
            <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">
              <div className="relative h-52 overflow-hidden">
                <img
                  src={magazineCover}
                  alt="Lire les anciens numéros en ligne"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <div className="bg-primary text-primary-foreground p-2 rounded-full">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <span className="text-white font-bold text-lg">Lecture en ligne</span>
                </div>
              </div>

              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-serif font-bold text-foreground mb-3">
                  Consultez en ligne, immédiatement
                </h3>
                <div className="space-y-2.5 mb-6 flex-1">
                  {[
                    "Accès instantané après achat",
                    "Lisible sur tous vos écrans",
                    "Vos numéros accessibles à vie",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <BookOpen className="w-4 h-4 text-primary shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-serif font-bold text-primary">Dès 3,00€</span>
                  <Button
                    className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-6"
                    onClick={() => navigate("/boutique")}
                  >
                    Voir les archives <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Physical / Delivery */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            viewport={{ once: true }}
            className="group"
          >
            <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">
              <div className="relative h-52 overflow-hidden">
                <img
                  src={magazineCover}
                  alt="Commander les anciens numéros en papier"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <div className="bg-accent text-accent-foreground p-2 rounded-full">
                    <Package className="w-5 h-5" />
                  </div>
                  <span className="text-white font-bold text-lg">Livraison à domicile</span>
                </div>
              </div>

              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-serif font-bold text-foreground mb-3">
                  Recevez-le chez vous en papier
                </h3>
                <div className="space-y-2.5 mb-6 flex-1">
                  {[
                    "Livraison offerte en France",
                    "Expédié sous 48h",
                    "Tant qu'il y a du stock",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <Truck className="w-4 h-4 text-accent shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-serif font-bold text-primary">Dès 5,00€</span>
                  <Button
                    variant="outline"
                    className="rounded-full border-foreground/20 hover:bg-secondary px-6"
                    onClick={() => navigate("/boutique")}
                  >
                    Commander <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BackIssuesSection;
