import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, CheckCircle, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import SideCart from "@/components/SideCart";

const Contact = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-contact", {
        body: form,
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Impossible d'envoyer le message.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartProvider>
    <div className="min-h-screen bg-background">
      <Header />
      <SideCart />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <span className="inline-block py-1.5 px-4 rounded-full bg-primary/10 text-primary font-bold text-xs tracking-widest uppercase mb-5">
              Contact
            </span>
            <h1 className="text-3xl md:text-4xl font-serif font-bold mb-4 text-foreground">
              Contactez-nous
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Une question, une suggestion ? Nous vous répondrons dans les plus brefs délais.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
            {/* Info cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">Email</h3>
                  <p className="text-sm text-muted-foreground">contact@info-peche.fr</p>
                </div>
              </div>
              <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">Téléphone</h3>
                  <p className="text-sm text-muted-foreground">04 XX XX XX XX</p>
                </div>
              </div>
              <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">Adresse</h3>
                  <p className="text-sm text-muted-foreground">France</p>
                </div>
              </div>
            </motion.div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="md:col-span-2"
            >
              {sent ? (
                <div className="text-center py-16 bg-card rounded-2xl border border-border">
                  <CheckCircle className="w-16 h-16 mx-auto text-primary mb-4" />
                  <h2 className="text-xl font-bold mb-2 text-foreground">Message envoyé !</h2>
                  <p className="text-muted-foreground">Nous reviendrons vers vous rapidement.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nom *</Label>
                      <Input id="name" name="name" required value={form.name} onChange={handleChange} className="mt-1.5" />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" name="email" type="email" required value={form.email} onChange={handleChange} className="mt-1.5" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="subject">Sujet *</Label>
                    <Input id="subject" name="subject" required value={form.subject} onChange={handleChange} className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      value={form.message}
                      onChange={handleChange}
                      className="resize-none mt-1.5"
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-5 font-bold">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    Envoyer le message
                  </Button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
    </CartProvider>
  );
};

export default Contact;
