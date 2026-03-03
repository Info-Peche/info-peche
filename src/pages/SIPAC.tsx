import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, ExternalLink, Users, ShoppingBag, Mic, Trophy, Heart, Facebook, Send, Mail, Phone, Building2, Clock, Euro, Car, Train, Bus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SideCart from "@/components/SideCart";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const stats = [
  { value: "4e", label: "Édition" },
  { value: "9000", suffix: "m²", label: "D'exposition" },
  { value: "60+", label: "Marques d'exposants" },
];

const highlights = [
  {
    icon: Trophy,
    title: "Compétition ALL STAR GAME",
    description: "Le vendredi 06 novembre, une grande compétition internationale réunissant les meilleurs pêcheurs au monde. En plein centre-ville d'Amiens, au bassin de la Hotoie, une occasion unique et gratuite de les voir à l'œuvre.",
    image: "/images/sipac/competition.jpg",
  },
  {
    icon: ShoppingBag,
    title: "Matériels & Nouveautés",
    description: "Le salon regroupe les plus grandes marques françaises et étrangères. Découvrez en exclusivité leurs toutes dernières nouveautés des collections 2027, disponibles à l'achat directement sur les stands.",
    image: "/images/sipac/materiel.jpg",
  },
  {
    icon: Mic,
    title: "Conférences Gratuites",
    description: "Les meilleurs spécialistes et les plus grands champions internationaux répondent à toutes vos questions lors de nombreuses conférences gratuites le samedi 07 et le dimanche 08 novembre.",
    image: "/images/sipac/conferences.jpg",
  },
  {
    icon: Users,
    title: "Échanges & Rencontres",
    description: "Des moments de rencontres et d'échanges privilégiés entre passionnés pendant toute la durée du salon. L'occasion de se retrouver et de partager autour d'une passion commune.",
    image: "/images/sipac/echanges.jpg",
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
        {/* Hero with official logo */}
        <section className="relative bg-gradient-to-br from-[hsl(25,100%,40%)]/10 via-accent/5 to-background py-16 md:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto text-center"
            >
              <img
                src="/images/sipac/sipac-logo-official.png"
                alt="SIPAC - 4e Salon International des Pêches au Coup - Mégacité Amiens - 07 & 08 Novembre 2026"
                className="w-56 h-56 md:w-72 md:h-72 mx-auto mb-8 object-contain"
              />

              {/* Stats */}
              <div className="flex justify-center gap-6 md:gap-12 mb-8">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-2xl md:text-4xl font-bold text-primary">
                      {stat.value}<span className="text-lg md:text-2xl">{stat.suffix || ""}</span>
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
                Le rendez-vous incontournable des pêches au coup
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
                Après le succès de la 3<sup>e</sup> édition en 2024, le SIPAC revient les 07 & 08 novembre 2026. 
                Professionnels et passionnés se retrouveront le temps d'un week-end pour partager et échanger autour de leur passion commune. 
                Plus de 9000m² d'exposition et 60 marques d'exposants vous attendent.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="https://www.sipac-amiens.com/fr" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-8 shadow-lg">
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Billetterie & Infos
                  </Button>
                </a>
                <a href="https://www.facebook.com/groups/sipacamiens/" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary text-primary hover:bg-primary/5 font-bold rounded-full px-8">
                    <Facebook className="w-5 h-5 mr-2" />
                    Groupe Facebook
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Au Programme - highlights with images */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">Au Programme</h2>
            <div className="space-y-12 md:space-y-16">
              {highlights.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex flex-col ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} gap-6 md:gap-10 items-center`}
                >
                  {item.image ? (
                    <div className="w-full md:w-1/2 overflow-hidden rounded-2xl shadow-lg">
                      <img src={item.image} alt={item.title} className="w-full h-64 md:h-80 object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                  ) : null}
                  <div className={`w-full ${item.image ? "md:w-1/2" : ""} text-center md:text-left`}>
                    <div className="bg-primary/10 p-3 rounded-xl w-fit mb-4 mx-auto md:mx-0">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Infos Pratiques */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-10 text-center">Infos Pratiques</h2>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {/* Horaires */}
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <div className="bg-primary/10 p-3 rounded-xl w-fit mb-4">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground mb-3">Horaires</h3>
                    <ul className="text-sm text-muted-foreground space-y-1.5">
                      <li>Samedi 07 nov. : <strong className="text-foreground">9h – 19h</strong></li>
                      <li>Dimanche 08 nov. : <strong className="text-foreground">9h – 18h</strong></li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Tarifs */}
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <div className="bg-primary/10 p-3 rounded-xl w-fit mb-4">
                      <Euro className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground mb-3">Tarifs</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p className="font-semibold text-foreground text-xs uppercase tracking-wide mb-1">Sur place</p>
                      <p>Journée : <strong className="text-foreground">10€</strong> · 2 jours : <strong className="text-foreground">12€</strong></p>
                      <p>Réduit : <strong className="text-foreground">4€</strong> · Gratuit -12 ans</p>
                      <p className="font-semibold text-foreground text-xs uppercase tracking-wide mt-3 mb-1">Préventes</p>
                      <p>Journée : <strong className="text-foreground">8€</strong> · 2 jours : <strong className="text-foreground">9€</strong></p>
                    </div>
                  </CardContent>
                </Card>

                {/* Lieu */}
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <div className="bg-primary/10 p-3 rounded-xl w-fit mb-4">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground mb-3">Lieu</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      <strong className="text-foreground">Mégacité</strong> – Parc des expositions<br />
                      Avenue de l'Hippodrome<br />
                      80 011 Amiens Cedex 1
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">🅿️ Parking gratuit · 🍽️ Restauration sur place</p>
                  </CardContent>
                </Card>
              </div>

              {/* Accès */}
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <h3 className="font-bold text-foreground mb-4">Comment venir ?</h3>
                  <div className="grid sm:grid-cols-3 gap-6 text-sm text-muted-foreground">
                    <div className="flex gap-3">
                      <Car className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-foreground mb-1">En voiture</p>
                        <p>À 1h15 de Paris par l'A16, 1h30 de Calais, 2h de Bruxelles, 1h30 de Reims.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Train className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-foreground mb-1">En train</p>
                        <p>À 1h de Paris Gare du Nord, 35 min de CDG, 50 min de Lille depuis la gare TGV Haute-Picardie.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Bus className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-foreground mb-1">En bus</p>
                        <p>Ligne N4 – Direction Pôle Licorne, Arrêt Mégacité.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
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
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Votre nom" required maxLength={100} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Société / Association</label>
                    <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Nom de votre structure" maxLength={100} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-muted-foreground" /> E-mail *
                    </label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="votre@email.com" required maxLength={255} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-muted-foreground" /> Téléphone
                    </label>
                    <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="06 12 34 56 78" maxLength={20} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Message *</label>
                  <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Décrivez votre projet d'exposition, vos besoins en espace, etc." rows={5} required maxLength={2000} />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full py-6 shadow-md">
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
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-10 shadow-lg">
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
