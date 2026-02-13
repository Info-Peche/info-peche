import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
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
    <section id="subscribe" className="py-24 bg-gradient-to-b from-white to-secondary/30">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-accent font-semibold tracking-wider uppercase text-sm">La Boutique</span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mt-2 mb-6 text-primary">
            Choisissez Votre Formule
          </h2>
          <p className="text-muted-foreground text-lg">
            Que ce soit pour découvrir ou pour vous perfectionner sur la durée, nous avons l'offre qu'il vous faut.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative rounded-2xl p-8 border ${
                product.highlight 
                  ? "bg-primary text-white border-primary shadow-2xl scale-105 z-10" 
                  : "bg-white text-foreground border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              }`}
            >
              {product.highlight && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-accent text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  Best Value
                </div>
              )}

              <div className="mb-8">
                <h3 className={`text-2xl font-bold mb-2 ${product.highlight ? "text-white" : "text-primary"}`}>
                  {product.name}
                </h3>
                <p className={`text-sm ${product.highlight ? "text-primary-foreground/90" : "text-muted-foreground"}`}>
                  {product.description}
                </p>
              </div>

              <div className="mb-8">
                <span className="text-4xl font-bold">{product.price}€</span>
                {product.id !== "mag-single" && <span className={`text-sm ml-1 ${product.highlight ? "text-primary-foreground/90" : "text-muted-foreground"}`}>/période</span>}
              </div>

              <ul className="space-y-4 mb-8">
                {product.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 shrink-0 ${product.highlight ? "text-accent" : "text-primary"}`} />
                    <span className={`text-sm ${product.highlight ? "text-primary-foreground/90" : "text-foreground/80"}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full py-6 rounded-xl font-bold text-lg transition-all ${
                  product.highlight
                    ? "bg-white text-primary hover:bg-secondary"
                    : "bg-primary text-white hover:bg-primary/90"
                }`}
                onClick={() => addItem(product)}
              >
                Ajouter au panier
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingCards;
