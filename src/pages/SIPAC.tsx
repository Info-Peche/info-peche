import { motion } from "framer-motion";
import { Calendar, MapPin, ExternalLink, Users, ShoppingBag, Mic, Trophy, Heart, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SideCart from "@/components/SideCart";

const highlights = [
  {
    icon: ShoppingBag,
    title: "Matériel & Nouveautés",
    description: "Les plus grandes marques françaises et étrangères présentent en exclusivité leurs toutes dernières nouveautés.",
  },
  {
    icon: Users,
    title: "Vente & Bonnes Affaires",
    description: "Grâce aux nombreux détaillants présents, achetez les dernières nouveautés et profitez d'offres exceptionnelles.",
  },
  {
    icon: Mic,
    title: "Conférences Gratuites",
    description: "Rencontrez, échangez et posez vos questions aux meilleurs spécialistes et aux plus grands champions internationaux.",
  },
  {
    icon: Trophy,
    title: "Compétition ALL STAR GAME",
    description: "Une compétition réunissant les meilleurs pêcheurs du monde, le vendredi 6 novembre de 12h00 à 16h00 à proximité de Mégacité.",
  },
  {
    icon: Heart,
    title: "Échanges & Rencontres",
    description: "L'occasion de se retrouver, d'échanger et de discuter entre véritables passionnés des pêches au coup.",
  },
];

const SIPAC = () => {
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

        {/* Highlights */}
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
                  <Card className="h-full border-border/50 hover:shadow-lg transition-shadow">
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

        {/* CTA */}
        <section className="py-16">
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
