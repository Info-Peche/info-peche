import { motion } from "framer-motion";
import { Truck, CreditCard, Headphones } from "lucide-react";

const guarantees = [
  {
    icon: Truck,
    title: "Livraison Offerte",
    description: "Sur tous les abonnements, en France métropolitaine.",
  },
  {
    icon: CreditCard,
    title: "Paiement 100% Sécurisé",
    description: "Par carte bancaire via notre partenaire Stripe.",
  },
  {
    icon: Headphones,
    title: "Service Client Réactif",
    description: "Une question ? Notre équipe vous répond sous 24h.",
  },
];

const TrustBar = () => {
  return (
    <section className="py-10 md:py-16 bg-secondary/50 border-y border-border">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-3 md:grid-cols-3 gap-4 md:gap-8 max-w-4xl mx-auto">
          {guarantees.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="mx-auto w-10 h-10 md:w-14 md:h-14 bg-primary/10 rounded-full flex items-center justify-center mb-2 md:mb-4">
                <item.icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <h4 className="font-bold text-foreground mb-0.5 md:mb-1 text-xs md:text-base leading-tight">{item.title}</h4>
              <p className="text-[10px] md:text-sm text-muted-foreground hidden md:block">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBar;
