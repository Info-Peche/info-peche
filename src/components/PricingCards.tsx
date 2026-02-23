import { motion } from "framer-motion";
import { Check, Sparkles, Crown, Star, Zap, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/CartContext";
import { PRODUCTS } from "@/lib/products";

const COVER_IMAGE = "https://fokaikipfikcokjwyeka.supabase.co/storage/v1/object/public/magazine-covers/ip100-cover.png";

const PricingCards = () => {
  const { addItem } = useCart();

  const cards = [
    {
      ...PRODUCTS.abo6mois,
      highlight: false,
      icon: Zap,
      badge: null,
      pricePerIssue: "4,83€",
      ctaLabel: "Découvrir",
      accentClass: "from-blue-500/10 to-blue-600/5",
      iconBg: "bg-blue-500/10 text-blue-600",
      checkColor: "bg-blue-500/10 text-blue-600",
    },
    {
      ...PRODUCTS.abo1an,
      highlight: false,
      icon: Star,
      badge: "Populaire",
      pricePerIssue: "4,42€",
      ctaLabel: "S'abonner 1 an",
      accentClass: "from-amber-500/10 to-amber-600/5",
      iconBg: "bg-amber-500/10 text-amber-600",
      checkColor: "bg-amber-500/10 text-amber-600",
    },
    {
      ...PRODUCTS.abo2ans,
      highlight: true,
      icon: Crown,
      badge: "Meilleure offre",
      pricePerIssue: "4,00€",
      ctaLabel: "S'abonner 2 ans",
      accentClass: "from-primary/15 to-primary/5",
      iconBg: "bg-primary/10 text-primary",
      checkColor: "bg-primary/10 text-primary",
    },
    {
      ...PRODUCTS.numeroCourant,
      highlight: false,
      icon: ShoppingBag,
      badge: null,
      pricePerIssue: null,
      ctaLabel: "Commander",
      accentClass: "from-muted/50 to-muted/20",
      iconBg: "bg-muted text-muted-foreground",
      checkColor: "bg-muted text-muted-foreground",
    },
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
          className="text-center max-w-3xl mx-auto mb-6"
        >
          <span className="text-primary font-bold tracking-widest uppercase text-xs mb-3 block">
            La Boutique Officielle
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-foreground">
            Abonnez-vous à la passion
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Rejoignez plus de 20 000 lecteurs et recevez chaque numéro directement chez vous.
          </p>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-2 mb-14"
        >
          <div className="flex -space-x-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary">
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
          <span className="text-sm text-muted-foreground ml-2">
            <strong className="text-foreground">+1 200 abonnés</strong> nous font déjà confiance
          </span>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto items-start">
          {cards.map((product, index) => {
            const Icon = product.icon;
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative rounded-2xl overflow-hidden flex flex-col ${
                  product.highlight
                    ? "bg-card border-2 border-primary shadow-[0_0_40px_-10px_hsl(var(--primary)/0.3)] z-10 lg:-mt-6 lg:mb-0"
                    : "bg-card border border-border hover:border-primary/30 transition-colors duration-300"
                }`}
              >
                {/* Top badge */}
                {product.badge && (
                  <div className={`text-center py-2.5 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 ${
                    product.highlight
                      ? "bg-primary text-primary-foreground"
                      : "bg-amber-500/10 text-amber-600"
                  }`}>
                    {product.highlight && <Sparkles className="w-3.5 h-3.5" />}
                    {product.badge}
                  </div>
                )}

                {/* Gradient accent */}
                <div className={`h-1 bg-gradient-to-r ${product.accentClass}`} />

                <div className="px-6 pt-5 pb-6 flex flex-col flex-1">
                  {/* Icon + name */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${product.iconBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground leading-tight">{product.name}</h3>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{product.description}</p>

                  {/* Price block */}
                  <div className="mb-5 pb-4 border-b border-border">
                    <div className="flex items-end gap-1.5">
                      <span className={`text-4xl font-serif font-bold tracking-tight ${product.highlight ? "text-primary" : "text-foreground"}`}>
                        {product.price}€
                      </span>
                      {"interval" in product && (
                        <span className="text-sm text-muted-foreground mb-1">/ {product.interval}</span>
                      )}
                    </div>
                    {product.pricePerIssue && (
                      <p className="text-xs text-muted-foreground mt-1">
                        soit <strong className="text-foreground">{product.pricePerIssue}</strong> / numéro
                      </p>
                    )}
                    {product.id === "abo-2-ans" && (
                      <Badge variant="outline" className="mt-2 text-[10px] border-primary/30 text-primary font-bold">
                        💳 ou 4 × 12€ sans frais
                      </Badge>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {product.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <div className={`mt-0.5 rounded-full p-0.5 shrink-0 ${product.checkColor}`}>
                          <Check className="w-3 h-3" />
                        </div>
                        <span className="text-xs text-foreground/80 leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    className={`w-full py-5 rounded-xl font-bold transition-all duration-300 ${
                      product.highlight
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/30"
                        : product.badge
                          ? "bg-foreground text-background hover:bg-foreground/90"
                          : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                    }`}
                    onClick={() => addItem({ id: product.id, name: product.name, price: product.price, image: COVER_IMAGE })}
                  >
                    {product.ctaLabel}
                  </Button>

                  {/* Guarantee micro-copy */}
                  {"interval" in product && (
                    <p className="text-[10px] text-muted-foreground text-center mt-3">
                      Sans engagement · Annulable à tout moment
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Trust micro-copy */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-6 mt-12 text-xs text-muted-foreground"
        >
          <span className="flex items-center gap-1.5">🔒 Paiement 100% sécurisé</span>
          <span className="flex items-center gap-1.5">📦 Livraison soignée</span>
          <span className="flex items-center gap-1.5">💳 CB, PayPal, SEPA</span>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingCards;
