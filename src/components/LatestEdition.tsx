import { motion } from "framer-motion";
import { Check, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import magazineCover from "@/assets/magazine-cover.jpg";

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
    name: "Info-Pêche N°154 - Édition Actuelle",
    price: 6.90,
    image: magazineCover,
    description: "Le guide ultime pour réussir votre saison de pêche."
  };

  return (
    <section id="magazine" className="py-24 bg-secondary/30">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex-1 relative group"
          >
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full transform rotate-12 group-hover:bg-primary/30 transition-all duration-500" />
            <img 
              src={magazineCover} 
              alt="Couverture du magazine Info-Pêche" 
              className="relative z-10 w-full max-w-md mx-auto rounded-xl shadow-2xl transform transition-transform duration-500 hover:scale-[1.02] hover:-rotate-1"
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex-1 space-y-8"
          >
            <div>
              <span className="text-accent font-semibold tracking-wider uppercase text-sm">En Kiosque</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold mt-2 mb-4 text-primary">
                L'Édition du Mois
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Plongez au cœur de l'action avec notre dernier numéro. Des articles exclusifs rédigés par les plus grands champions, des tests impartiaux et des secrets bien gardés.
              </p>
            </div>

            <div className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="bg-primary/10 p-1 rounded-full text-primary">
                    <Check className="h-4 w-4" />
                  </div>
                  <span className="text-foreground/80 font-medium">{feature}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center gap-4">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                onClick={() => addItem(product)}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Acheter ce numéro (6.90€)
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LatestEdition;
