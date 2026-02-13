import { motion } from "framer-motion";
import { Smartphone, Tablet, Monitor, ShoppingCart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useState } from "react";
import magazineCover from "@/assets/magazine-cover-new.jpg";
import previewSommaire from "@/assets/preview-sommaire.jpg";
import previewReportage from "@/assets/preview-reportage.jpg";
import previewTechnique from "@/assets/preview-technique.jpg";

const pages = [
  { src: magazineCover, label: "Couverture" },
  { src: previewSommaire, label: "Sommaire" },
  { src: previewReportage, label: "Reportage" },
  { src: previewTechnique, label: "Technique" },
];

const DigitalMagazine = () => {
  const { addItem } = useCart();
  const [activePage, setActivePage] = useState(0);

  const product = {
    id: "mag-digital",
    name: "Info-Pêche - Édition Numérique",
    price: 4.90,
    image: magazineCover,
    description: "Version numérique du dernier numéro, lisible sur tous vos écrans.",
  };

  return (
    <section className="py-24 bg-secondary/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

      <div className="container px-4 mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block py-1 px-3 rounded-md bg-primary/10 text-primary font-bold text-sm tracking-wide mb-4">
            FORMAT NUMÉRIQUE
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Lisez-le partout, tout de suite
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Recevez votre magazine instantanément en version numérique. Feuilletez-le sur votre tablette, 
            smartphone ou ordinateur — avec le même contenu exclusif que la version papier.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Preview pages */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex-1 w-full max-w-xl"
          >
            {/* Main preview */}
            <div className="relative bg-foreground/5 rounded-2xl p-3 shadow-2xl border border-border/50 mb-4">
              <div className="relative overflow-hidden rounded-xl aspect-[3/4]">
                <motion.img
                  key={activePage}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  src={pages[activePage].src}
                  alt={pages[activePage].label}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white/90 text-sm font-medium">
                  <Eye className="h-4 w-4" />
                  Aperçu — {pages[activePage].label}
                </div>
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-3 justify-center">
              {pages.map((page, i) => (
                <button
                  key={i}
                  onClick={() => setActivePage(i)}
                  className={`relative rounded-lg overflow-hidden border-2 transition-all duration-200 w-16 h-20 md:w-20 md:h-[6.5rem] ${
                    activePage === i
                      ? "border-primary shadow-lg scale-105"
                      : "border-border/50 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={page.src}
                    alt={page.label}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] text-center py-0.5 leading-tight">
                    {page.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Info + CTA */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex-1 space-y-8"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-muted-foreground">
                <Smartphone className="h-5 w-5" />
                <Tablet className="h-5 w-5" />
                <Monitor className="h-5 w-5" />
                <span className="text-sm font-medium">Compatible tous écrans</span>
              </div>

              <h3 className="text-3xl font-serif font-bold text-foreground">
                Le même contenu premium,<br />en un clic
              </h3>

              <p className="text-muted-foreground leading-relaxed">
                Pas besoin d'attendre la livraison. Accédez à l'intégralité du magazine — reportages, 
                dossiers techniques, tests matériel et résultats de compétitions — directement depuis votre écran. 
                Zoomez sur les schémas, partagez les articles, lisez hors connexion.
              </p>
            </div>

            <div className="space-y-3">
              {[
                "Accès immédiat après achat",
                "Lisible sur smartphone, tablette et PC",
                "Contenu identique à la version papier",
                "Fonction zoom sur les schémas & photos",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  <span className="text-foreground text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>

            <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm">
              <div className="flex items-end gap-2 mb-1">
                <span className="text-4xl font-serif font-bold text-foreground">4,90€</span>
                <span className="text-muted-foreground text-sm mb-1">/ numéro</span>
              </div>
              <p className="text-muted-foreground text-sm mb-5">
                Soit 2€ de moins que la version papier
              </p>
              <Button
                size="lg"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full py-6 text-lg shadow-lg"
                onClick={() => addItem(product)}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Acheter en numérique
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DigitalMagazine;
