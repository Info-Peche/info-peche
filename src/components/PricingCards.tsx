import { motion } from "framer-motion";
import { Check, Star, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";

const PricingCards = () => {
  const { addItem } = useCart();

  const products = [
    {
      id: "mag-single",
      name: "Le Numéro",
      price: 6.90,
      description: "L'édition actuelle livrée chez vous",
      features: [
        "Magazine papier haute qualité",
        "Livraison incluse",
        "Accès aux articles en ligne"
      ],
      highlight: false
    },
    {
      id: "sub-1-year",
      name: "Abonnement 1 An",
      price: 59.00,
      description: "L'essentiel pour progresser",
      features: [
        "10 numéros par an",
        "Version numérique incluse",
        "Accès aux archives (1 an)",
        "Newsletter exclusive"
      ],
      highlight: false
    },
    {
      id: "sub-2-years",
      name: "Abonnement 2 Ans",
      price: 99.00,
      description: "L'offre préférée des passionnés",
      features: [
        "20 numéros sur 2 ans",
        "Cadeau de bienvenue exclusif",
        "Accès illimité aux archives",
        "Invitations événements VIP",
        "Économisez 30%"
      ],
      highlight: true
    }
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative rounded-2xl p-8 ${
                product.highlight 
                  ? "bg-white border-2 border-accent shadow-2xl z-10" 
                  : "bg-white border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              }`}
            >
              {product.highlight && (
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-primary text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 uppercase tracking-wide">
                  <Trophy className="w-4 h-4" />
                  Meilleure Offre
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2 text-foreground">
                  {product.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {product.description}
                </p>
              </div>

              <div className="mb-8 pb-8 border-b border-border">
                <div className="flex items-baseline">
                  <span className={`text-4xl font-bold ${product.highlight ? "text-primary" : "text-foreground"}`}>{product.price}€</span>
                  {product.id !== "mag-single" && <span className="text-sm text-muted-foreground ml-2">/période</span>}
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {product.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-full p-0.5 ${product.highlight ? "bg-accent text-accent-foreground" : "bg-secondary text-primary"}`}>
                       <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm text-foreground/80">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full py-6 rounded-xl font-bold text-lg transition-all ${
                  product.highlight
                    ? "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
                    : "bg-foreground text-white hover:bg-foreground/90"
                }`}
                onClick={() => addItem(product)}
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
