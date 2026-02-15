import { motion } from "framer-motion";
import { Check, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { PRODUCTS } from "@/lib/products";

const PricingCards = () => {
  const { addItem } = useCart();

  const cards = [
    { ...PRODUCTS.abo6mois, highlight: false },
    { ...PRODUCTS.abo1an, highlight: false },
    { ...PRODUCTS.abo2ans, highlight: true },
    { ...PRODUCTS.numeroCourant, highlight: false },
  ];

  return (
    <section id="subscribe" className="py-24 bg-gradient-to-b from-secondary/50 to-white">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-bold tracking-widest uppercase text-sm mb-2 block">La Boutique Officielle</span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-foreground">
            Abonnez-vous à la passion
          </h2>
          <p className="text-muted-foreground text-lg">
            Rejoignez plus de 20 000 lecteurs et recevez chaque mois l'expertise Info-Pêche directement dans votre boîte aux lettres.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto items-start">
          {cards.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative rounded-2xl p-6 ${
                product.highlight 
                  ? "bg-white border-2 border-accent shadow-2xl z-10 lg:-mt-4 lg:pb-8" 
                  : "bg-white border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              }`}
            >
              {product.highlight && (
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-primary text-white px-5 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 uppercase tracking-wide whitespace-nowrap">
                  <Trophy className="w-3.5 h-3.5" />
                  Meilleure Offre
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-xl font-bold mb-1 text-foreground">{product.name}</h3>
                <p className="text-xs text-muted-foreground">{product.description}</p>
              </div>

              <div className="mb-6 pb-4 border-b border-border">
                <div className="flex items-baseline">
                  <span className={`text-3xl font-bold ${product.highlight ? "text-primary" : "text-foreground"}`}>
                    {product.price}€
                  </span>
                  {"interval" in product && (
                    <span className="text-xs text-muted-foreground ml-1.5">/{product.interval}</span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {product.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <div className={`mt-0.5 rounded-full p-0.5 ${product.highlight ? "bg-accent text-accent-foreground" : "bg-secondary text-primary"}`}>
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-xs text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full py-5 rounded-xl font-bold transition-all ${
                  product.highlight
                    ? "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
                    : "bg-foreground text-white hover:bg-foreground/90"
                }`}
                onClick={() => addItem({ id: product.id, name: product.name, price: product.price })}
              >
                Je choisis cette offre
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingCards;
