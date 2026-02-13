import { motion } from "framer-motion";
import { Truck, Shield, CreditCard, Headphones } from "lucide-react";

const guarantees = [
  {
    icon: Truck,
    title: "Livraison Offerte",
    description: "Sur tous les abonnements, en France métropolitaine.",
  },
  {
    icon: Shield,
    title: "Satisfait ou Remboursé",
    description: "Vous pouvez annuler votre abonnement à tout moment.",
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
    <section className="py-16 bg-secondary/50 border-y border-border">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {guarantees.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-bold text-foreground mb-1 text-sm md:text-base">{item.title}</h4>
              <p className="text-xs md:text-sm text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBar;
