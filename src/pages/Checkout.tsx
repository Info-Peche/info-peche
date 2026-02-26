import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, ShoppingBag, Lock, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "@/context/CartContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SideCart from "@/components/SideCart";
import { PRODUCTS } from "@/lib/products";
import {
  calculateShipping,
  countPhysicalMagazines,
  hasOnlySubscriptions,
  SHIPPING_COUNTRIES,
} from "@/lib/shipping";

const CheckoutContent = () => {
  const { items, total } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [differentBilling, setDifferentBilling] = useState(false);

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
    comment: "",
    billing_address_line1: "",
    billing_address_line2: "",
    billing_city: "",
    billing_postal_code: "",
    billing_country: "FR",
  });

  const shippingCost = useMemo(
    () => calculateShipping(items, form.country),
    [items, form.country]
  );
  const physicalCount = useMemo(() => countPhysicalMagazines(items), [items]);
  const onlySubscriptions = useMemo(() => hasOnlySubscriptions(items), [items]);
  const grandTotal = total + shippingCost;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCountryChange = (value: string) => {
    setForm((prev) => ({ ...prev, country: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setLoading(true);
    try {
      const checkoutItems = items.map((item) => {
        const product = Object.values(PRODUCTS).find((p) => p.id === item.id) || PRODUCTS.ancienNumero;
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
          customer_info: {
            ...form,
            billing_different: differentBilling,
          },
          shipping_cents: Math.round(shippingCost * 100),
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

  // Check if cart has the 2-year subscription
  const has2YearSub = items.some((item) => item.id === "abo-2-ans");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>

          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-8 text-foreground">Finaliser votre commande</h1>

          <div className="grid md:grid-cols-5 gap-8">
            {/* Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="md:col-span-3 space-y-6"
            >
              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
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

              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <h2 className="text-lg font-bold text-foreground">Adresse de livraison</h2>
                <div>
                  <Label htmlFor="address_line1">Adresse *</Label>
                  <Input
                    id="address_line1"
                    name="address_line1"
                    required
                    value={form.address_line1}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="address_line2">Complément d'adresse</Label>
                  <Input id="address_line2" name="address_line2" value={form.address_line2} onChange={handleChange} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postal_code">Code postal *</Label>
                    <Input
                      id="postal_code"
                      name="postal_code"
                      required
                      value={form.postal_code}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Ville *</Label>
                    <Input id="city" name="city" required value={form.city} onChange={handleChange} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="country">Pays *</Label>
                  <Select value={form.country} onValueChange={handleCountryChange}>
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Choisir un pays" />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIPPING_COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Billing address toggle */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="different_billing"
                    checked={differentBilling}
                    onCheckedChange={(checked) => setDifferentBilling(!!checked)}
                  />
                  <Label htmlFor="different_billing" className="cursor-pointer font-medium">
                    Adresse de facturation différente de l'adresse de livraison
                  </Label>
                </div>

                {differentBilling && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4 pt-2"
                  >
                    <div>
                      <Label htmlFor="billing_address_line1">Adresse de facturation *</Label>
                      <Input
                        id="billing_address_line1"
                        name="billing_address_line1"
                        required
                        value={form.billing_address_line1}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="billing_address_line2">Complément</Label>
                      <Input
                        id="billing_address_line2"
                        name="billing_address_line2"
                        value={form.billing_address_line2}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="billing_postal_code">Code postal *</Label>
                        <Input
                          id="billing_postal_code"
                          name="billing_postal_code"
                          required
                          value={form.billing_postal_code}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="billing_city">Ville *</Label>
                        <Input
                          id="billing_city"
                          name="billing_city"
                          required
                          value={form.billing_city}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Comment */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-3">
                <Label htmlFor="comment">Commentaire (facultatif)</Label>
                <Textarea
                  id="comment"
                  name="comment"
                  value={form.comment}
                  onChange={handleChange}
                  placeholder="Instructions de livraison, message, etc."
                  rows={3}
                  className="resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-6 text-lg rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Redirection...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 mr-2" /> Payer {grandTotal.toFixed(2)}€
                  </>
                )}
              </Button>
              <div className="text-center space-y-2 mt-4">
                <p className="text-xs text-muted-foreground">Paiement sécurisé par Stripe — CB, PayPal, SEPA</p>
              </div>
            </motion.form>

            {/* Order summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="md:col-span-2"
            >
              <div className="bg-card rounded-xl border border-border p-6 sticky top-28">
                <h2 className="text-lg font-bold text-foreground mb-4">Récapitulatif</h2>
                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-20 object-contain rounded-lg border border-border flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground leading-tight">{item.name}</p>
                        {item.quantity > 1 && <p className="text-xs text-muted-foreground">×{item.quantity}</p>}
                        <p className="text-sm font-bold text-primary mt-1">
                          {(item.price * item.quantity).toFixed(2)}€
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {has2YearSub && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
                    <p className="text-xs font-bold text-primary mb-1">💳 Paiement en 4× disponible</p>
                    <p className="text-xs text-muted-foreground">
                      4 × {(48 / 4).toFixed(2)}€ — proposé à l'étape suivante via Stripe
                    </p>
                  </div>
                )}

                {/* Shipping line */}
                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span className="font-medium">{total.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5" /> Livraison
                    </span>
                    {onlySubscriptions || physicalCount === 0 ? (
                      <span className="text-xs font-bold text-primary">OFFERTE</span>
                    ) : shippingCost === 0 ? (
                      <span className="text-xs font-bold text-primary">OFFERTE</span>
                    ) : (
                      <span className="font-medium">{shippingCost.toFixed(2)}€</span>
                    )}
                  </div>
                  {physicalCount > 0 && !onlySubscriptions && (
                    <p className="text-[11px] text-muted-foreground">
                      {physicalCount} magazine{physicalCount > 1 ? "s" : ""} · {form.country === "FR" ? "France" : "International"}
                    </p>
                  )}
                  {onlySubscriptions && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Package className="w-3 h-3" /> Livraison offerte avec votre abonnement
                    </p>
                  )}
                </div>

                <div className="border-t border-border pt-4 mt-4 flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="text-xl font-bold text-primary">{grandTotal.toFixed(2)}€</span>
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
