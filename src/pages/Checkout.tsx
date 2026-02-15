import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, ShoppingBag, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/context/CartContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SideCart from "@/components/SideCart";
import { PRODUCTS } from "@/lib/products";

const CheckoutContent = () => {
  const { items, total } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    postal_code: "",
    country: "FR",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setLoading(true);
    try {
      // Map cart items to Stripe line items
      const checkoutItems = items.map(item => {
        // Find the matching product to get price_id and mode
        // Match by product id, or fallback to ancien-numero for back issues
        const product = Object.values(PRODUCTS).find(p => p.id === item.id) || PRODUCTS.ancienNumero;

        return {
          price_id: product.price_id,
          quantity: item.quantity,
          mode: product.mode,
          unit_amount: Math.round(product.price * 100),
        };
      });

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          items: checkoutItems,
          customer_info: form,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Pas d'URL de paiement reçue");
      }
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Une erreur est survenue lors de la création du paiement.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-28 pb-20">
          <div className="container mx-auto px-4 text-center">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h1 className="text-2xl font-bold mb-4">Votre panier est vide</h1>
            <Button onClick={() => navigate("/boutique")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour à la boutique
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>

          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-8 text-foreground">
            Finaliser votre commande
          </h1>

          <div className="grid md:grid-cols-5 gap-8">
            {/* Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="md:col-span-3 space-y-6"
            >
              <div className="bg-white rounded-xl border border-border p-6 space-y-4">
                <h2 className="text-lg font-bold text-foreground">Vos coordonnées</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">Prénom *</Label>
                    <Input id="first_name" name="first_name" required value={form.first_name} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Nom *</Label>
                    <Input id="last_name" name="last_name" required value={form.last_name} onChange={handleChange} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" name="email" type="email" required value={form.email} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-border p-6 space-y-4">
                <h2 className="text-lg font-bold text-foreground">Adresse de livraison</h2>
                <div>
                  <Label htmlFor="address_line1">Adresse *</Label>
                  <Input id="address_line1" name="address_line1" required value={form.address_line1} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="address_line2">Complément d'adresse</Label>
                  <Input id="address_line2" name="address_line2" value={form.address_line2} onChange={handleChange} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postal_code">Code postal *</Label>
                    <Input id="postal_code" name="postal_code" required value={form.postal_code} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="city">Ville *</Label>
                    <Input id="city" name="city" required value={form.city} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-6 text-lg rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Redirection...</>
                ) : (
                  <><Lock className="w-5 h-5 mr-2" /> Payer {total.toFixed(2)}€</>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Paiement sécurisé par Stripe — CB, PayPal, SEPA
              </p>
            </motion.form>

            {/* Order summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="md:col-span-2"
            >
              <div className="bg-white rounded-xl border border-border p-6 sticky top-28">
                <h2 className="text-lg font-bold text-foreground mb-4">Récapitulatif</h2>
                <div className="space-y-3 mb-6">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-foreground/80">
                        {item.name} {item.quantity > 1 && `×${item.quantity}`}
                      </span>
                      <span className="font-medium">{(item.price * item.quantity).toFixed(2)}€</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-4 flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="text-xl font-bold text-primary">{total.toFixed(2)}€</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const Checkout = () => (
  <>
    <CheckoutContent />
    <SideCart />
  </>
);

export default Checkout;
