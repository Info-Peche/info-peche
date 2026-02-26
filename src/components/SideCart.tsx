import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ShoppingBag, Trash2, Truck, Star, Shield, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { ScrollArea } from "@/components/ui/scroll-area";

const SideCart = () => {
  const { isOpen, setIsOpen, items, removeItem, updateQuantity, total } = useCart();

  const handleCheckout = () => {
    setIsOpen(false);
    window.location.href = "/commande";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="p-6 border-b flex items-center justify-between bg-secondary/20">
              <h2 className="text-xl font-serif font-bold text-primary flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Votre Panier
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="hover:bg-black/5">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Trust banner */}
            <div className="px-6 py-3 bg-primary/5 border-b border-primary/10 flex items-center gap-3">
              <Truck className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-semibold text-primary">Livraison OFFERTE pour tous les abonnements</span>
            </div>

            <ScrollArea className="flex-1 p-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Votre panier est vide pour le moment.</p>
                  <Button variant="link" onClick={() => setIsOpen(false)} className="mt-4 text-primary">
                    Continuer vos achats
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item) => (
                    <motion.div
                      layout
                      key={item.id}
                      className="flex gap-4 p-4 bg-secondary/10 rounded-xl border border-border"
                    >
                      {item.image && (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-20 h-20 object-cover rounded-lg bg-white shadow-sm" 
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-semibold text-sm line-clamp-2">{item.name}</h3>
                          <button 
                            onClick={() => removeItem(item.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-primary font-bold mb-3">{item.price.toFixed(2)}€</p>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 rounded-full hover:bg-secondary transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 rounded-full hover:bg-secondary transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="p-6 border-t bg-secondary/10 space-y-4">
              {/* Trust indicators */}
              {items.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <Star className="w-3.5 h-3.5 text-accent fill-accent shrink-0" />
                    <span><strong className="text-foreground">4.8/5</strong> — Noté par plus de 20 000 lecteurs</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Satisfait ou remboursé — Annulation à tout moment</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <CreditCard className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Paiement 100% sécurisé par Stripe</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <span className="text-muted-foreground">Total</span>
                <span className="text-2xl font-serif font-bold text-primary">
                  {total.toFixed(2)}€
                </span>
              </div>
              <Button 
                className="w-full py-6 text-lg rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg"
                disabled={items.length === 0}
                onClick={handleCheckout}
              >
                Passer la commande
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SideCart;
