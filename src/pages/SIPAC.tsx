import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, ExternalLink, Users, ShoppingBag, Mic, Trophy, Heart, Facebook, Send, Mail, Phone, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SideCart from "@/components/SideCart";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const highlights = [
  {
    icon: ShoppingBag,
    title: "Matériel & Nouveautés",
    description: "Les plus grandes marques françaises et étrangères présentent en exclusivité leurs toutes dernières nouveautés.",
    image: "/images/sipac/sipac-1.jpg",
  },
  {
    icon: Users,
    title: "Vente & Bonnes Affaires",
    description: "Grâce aux nombreux détaillants présents, achetez les dernières nouveautés et profitez d'offres exceptionnelles.",
    image: "/images/sipac/sipac-2.jpg",
  },
  {
    icon: Mic,
    title: "Conférences Gratuites",
    description: "Rencontrez, échangez et posez vos questions aux meilleurs spécialistes et aux plus grands champions internationaux.",
    image: "/images/sipac/sipac-3.jpg",
  },
  {
    icon: Trophy,
    title: "Compétition ALL STAR GAME",
    description: "Une compétition réunissant les meilleurs pêcheurs du monde, le vendredi 6 novembre de 12h00 à 16h00 à proximité de Mégacité.",
    image: "/images/sipac/sipac-4.jpg",
  },
  {
    icon: Heart,
    title: "Échanges & Rencontres",
    description: "L'occasion de se retrouver, d'échanger et de discuter entre véritables passionnés des pêches au coup.",
    image: null,
  },
];

const SIPAC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", message: "" });

  const handleExhibitorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-contact", {
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          subject: `[SIPAC Exposant] ${form.company?.trim() || form.name.trim()}`,
          message: `Société/Association : ${form.company?.trim() || "N/A"}\nTéléphone : ${form.phone?.trim() || "N/A"}\n\n${form.message.trim()}`,
        },
      });
      if (error) throw error;
      setSubmitted(true);
      setForm({ name: "", company: "", email: "", phone: "", message: "" });
      toast({ title: "Message envoyé !", description: "Nous reviendrons vers vous rapidement." });
    } catch {
      toast({ title: "Erreur", description: "Impossible d'envoyer le message. Réessayez.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SideCart />

      <main className="pt-28 pb-20">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-primary/10 via-accent/5 to-background py-16 md:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto text-center"
            >
              <span className="inline-block bg-accent text-accent-foreground px-4 py-1.5 rounded-full text-sm font-bold mb-6">
                7 & 8 Novembre 2026
              </span>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                SIPAC 2026
              </h1>
              <p className="text-xl md:text-2xl text-primary font-semibold mb-4">
                Salon International des Pêches au Coup
              </p>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
                Le rendez-vous incontournable de tous les passionnés des pêches au coup. 
                Un lieu de rencontre unique avec de nombreux événements, des points d'échanges 
                et de dialogues avec les meilleurs spécialistes et les plus grands champions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="https://www.sipac-amiens.com/fr" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold rounded-full px-8 shadow-lg">
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Billetterie & Infos
                  </Button>
                </a>
                <a href="https://www.facebook.com/groups/sipacamiens/" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/5 font-bold rounded-full px-8">
                    <Facebook className="w-5 h-5 mr-2" />
                    Groupe Facebook
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Photo gallery */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-5xl mx-auto">
              {["/images/sipac/sipac-1.jpg", "/images/sipac/sipac-2.jpg", "/images/sipac/sipac-3.jpg", "/images/sipac/sipac-4.jpg"].map((src, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="overflow-hidden rounded-xl aspect-[4/3]"
                >
                  <img src={src} alt={`SIPAC ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Infos pratiques */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Infos Pratiques</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-3 rounded-xl">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground mb-2">Lieu</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          Hall des Expositions de Mégacité, Amiens
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-3 rounded-xl">
                        <Calendar className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground mb-2">Dates</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          Samedi 7 & Dimanche 8 Novembre 2026
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6 border-border/50">
                <CardContent className="p-6">
                  <h3 className="font-bold text-foreground mb-3">🚗 Accès</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Accès facile et rapide par l'A1 ou l'A16 depuis les Hauts-de-France, la Belgique et la région parisienne, 
                    par l'A29 depuis l'Ouest et par l'A26 depuis l'Est.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Highlights with images */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Au Programme</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {highlights.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full border-border/50 hover:shadow-lg transition-shadow overflow-hidden">
                    {item.image && (
                      <div className="aspect-[16/9] overflow-hidden">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className="bg-primary/10 p-3 rounded-xl w-fit mb-4">
                        <item.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Exposants Contact Form */}
        <section className="py-16" id="exposants">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="text-center mb-10">
              <Building2 className="w-10 h-10 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-foreground mb-3">Devenir Exposant</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vous souhaitez être présent sur le SIPAC pour exposer ou vendre du matériel, 
                présenter votre parcours de pêche privé ou votre association ? 
                Nous avons forcément une solution adaptée à vos besoins et à votre budget.
              </p>
            </div>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Message envoyé !</h3>
                <p className="text-muted-foreground">Nous reviendrons vers vous dans les plus brefs délais.</p>
              </motion.div>
            ) : (
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                onSubmit={handleExhibitorSubmit}
                className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-5 shadow-sm"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Nom *</label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Votre nom"
                      required
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Société / Association</label>
                    <Input
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      placeholder="Nom de votre structure"
                      maxLength={100}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-muted-foreground" /> E-mail *
                    </label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="votre@email.com"
                      required
                      maxLength={255}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-muted-foreground" /> Téléphone
                    </label>
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="06 12 34 56 78"
                      maxLength={20}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Message *</label>
                  <Textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Décrivez votre projet d'exposition, vos besoins en espace, etc."
                    rows={5}
                    required
                    maxLength={2000}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-full py-6 shadow-md"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? "Envoi en cours…" : "Envoyer ma demande"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  En soumettant ce formulaire, vous acceptez notre politique de confidentialité.
                </p>
              </motion.form>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">On s'y retrouve ?</h2>
            <p className="text-muted-foreground mb-8">
              Retrouvez l'équipe Info Pêche au SIPAC 2026. Venez découvrir nos dernières publications et profitez d'offres exclusives sur le stand.
            </p>
            <a href="https://www.sipac-amiens.com/fr" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold rounded-full px-10 shadow-lg">
                Réserver ses places
              </Button>
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SIPAC;
