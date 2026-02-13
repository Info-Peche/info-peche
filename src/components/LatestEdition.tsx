import { motion } from "framer-motion";
import { Check, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import magazineCover from "@/assets/magazine-cover-new.jpg";

const LatestEdition = () => {
  const { addItem } = useCart();

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
    <section id="magazine" className="py-24 bg-white relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-secondary/30 -skew-x-12 transform translate-x-1/2" />

      <div className="container px-4 mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex-1 relative group w-full max-w-md"
          >
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full transform rotate-6 group-hover:rotate-12 transition-all duration-700" />
            <div className="relative z-10 p-4 bg-white rounded-xl shadow-2xl border border-border/50">
               <img 
                src={magazineCover} 
                alt="Couverture du magazine Info-Pêche" 
                className="w-full h-auto rounded-lg shadow-sm"
              />
            </div>
            
            {/* Sticker effect */}
            <div className="absolute -top-6 -right-6 z-20 bg-accent text-accent-foreground w-20 h-20 rounded-full flex items-center justify-center font-bold shadow-lg rotate-12">
              <span className="text-center text-sm leading-tight">NOUVEAU<br/>NUMÉRO</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex-1 space-y-8"
          >
            <div>
              <span className="inline-block py-1 px-3 rounded-md bg-red-100 text-primary font-bold text-sm tracking-wide mb-4">
                ACTUELLEMENT EN KIOSQUE
              </span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-foreground">
                L'Édition du Mois
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Plongez au cœur de l'action avec notre dernier numéro. Des articles exclusifs rédigés par les plus grands champions, des tests impartiaux et des secrets bien gardés.
              </p>
            </div>

            <div className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors">
                  <div className="bg-primary text-white p-1 rounded-full shrink-0">
                    <Check className="h-4 w-4" />
                  </div>
                  <span className="text-foreground font-medium">{feature}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Button 
                size="lg" 
                className="bg-foreground text-white hover:bg-foreground/90 rounded-full px-8 py-6 text-lg shadow-lg"
                onClick={() => addItem(product)}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Acheter ce numéro (6.90€)
              </Button>
              <span className="text-sm text-muted-foreground">
                Livraison gratuite en France métropolitaine
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LatestEdition;
