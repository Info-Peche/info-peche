import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { PRODUCTS } from "@/lib/products";

const COVER_IMAGE = "https://fokaikipfikcokjwyeka.supabase.co/storage/v1/object/public/magazine-covers/ip100-cover.png";

const PricingCards = () => {
  const { addItem } = useCart();

  const cards = [
    { ...PRODUCTS.abo6mois, highlight: false },
    { ...PRODUCTS.abo1an, highlight: false },
    { ...PRODUCTS.abo2ans, highlight: true },
    { ...PRODUCTS.numeroCourant, highlight: false },
  ];

  return (
    <section id="subscribe" className="py-28 bg-gradient-to-b from-secondary/50 via-background to-background relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />

      <div className="container px-4 mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-bold tracking-widest uppercase text-xs mb-3 block">
            La Boutique Officielle
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-foreground">
            Abonnez-vous à la passion
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Rejoignez plus de 20 000 lecteurs et recevez chaque mois l'expertise Info-Pêche directement dans votre boîte aux lettres.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto items-start">
          {cards.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative rounded-2xl overflow-hidden ${
                product.highlight
                  ? "bg-card border-2 border-primary shadow-glow-primary z-10 lg:-mt-4 lg:pb-8"
                  : "bg-card border border-border card-hover"
              }`}
            >
              {product.highlight && (
                <div className="bg-primary text-primary-foreground text-center py-2 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Meilleure Offre
                </div>
              )}

              {/* Cover image */}
              <div className="px-6 pt-5 pb-2">
                <img
                  src={COVER_IMAGE}
                  alt="Couverture Info Pêche N°100"
                  className="w-full h-36 object-contain rounded-lg"
                />
              </div>

              <div className="px-6 pb-6">
                <div className="mb-4">
                  <h3 className="text-lg font-bold mb-1 text-foreground">{product.name}</h3>
                  <p className="text-xs text-muted-foreground">{product.description}</p>
                </div>

                <div className="mb-6 pb-4 border-b border-border">
                  <div className="flex items-baseline">
                    <span className={`text-4xl font-serif font-bold ${product.highlight ? "text-primary" : "text-foreground"}`}>
                      {product.price}€
                    </span>
                    {"interval" in product && (
                      <span className="text-xs text-muted-foreground ml-1.5">/{product.interval}</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <div className={`mt-0.5 rounded-full p-0.5 ${product.highlight ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"}`}>
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-xs text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full py-5 rounded-xl font-bold transition-all duration-300 ${
                    product.highlight
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:scale-[1.02]"
                      : "bg-foreground text-background hover:bg-foreground/90"
                  }`}
                  onClick={() => addItem({ id: product.id, name: product.name, price: product.price, image: COVER_IMAGE })}
                >
                  Je choisis cette offre
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingCards;
