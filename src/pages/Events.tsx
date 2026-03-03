import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SideCart from "@/components/SideCart";

const events = [
  {
    id: "sipac-2026",
    title: "SIPAC 2026 – Salon International des Pêches au Coup",
    description: "Le rendez-vous incontournable des passionnés de pêche au coup. Exposants, nouveautés, conférences, compétition ALL STAR GAME et rencontres avec les champions.",
    date: "7–8 Novembre 2026",
    location: "Mégacité, Amiens",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop",
    status: "À venir",
    link: "/sipac",
    featured: true,
  },
  {
    id: "specimen-trophy",
    title: "Specimen Trophy 2025–2027",
    description: "Envoyez vos photos de belles prises de poissons blancs spécimens et qualifiez-vous pour la grande finale en mai 2027 !",
    date: "Juillet 2025 – Mai 2027",
    location: "Toute la France",
    image: "/images/specimen-trophy.png",
    status: "En cours",
    link: "/specimen-trophy",
    featured: false,
  },
  {
    id: "coupe-info-peche",
    title: "Coupe Info Pêche 2026",
    description: "Notre compétition annuelle ouverte à tous les abonnés. Convivialité, bonne humeur et lots exceptionnels à gagner.",
    date: "20–21 Juin 2026",
    location: "Lac de Saint-Cassien, Var",
    image: "https://images.unsplash.com/photo-1504309092620-4d0ec726efa4?w=600&h=400&fit=crop",
    status: "À venir",
    link: null,
    featured: false,
  },
];

const Events = () => {
  return (
    <>
      <div className="min-h-screen bg-background">
        <Header />
        <SideCart />

        <main className="pt-28 pb-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-16"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Événements
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Retrouvez tous les événements organisés ou couverts par Info Pêche : salons, compétitions, rencontres.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 }}
                  className={event.featured ? "md:col-span-2" : ""}
                >
                  <Card className={`group overflow-hidden border-border/50 hover:shadow-xl transition-all duration-300 h-full ${event.featured ? "ring-2 ring-primary/30" : ""}`}>
                    <div className={`${event.featured ? "md:flex" : ""}`}>
                      <div className={`relative overflow-hidden ${event.featured ? "md:w-1/2" : ""}`}>
                        <img
                          src={event.image}
                          alt={event.title}
                          className={`w-full object-cover group-hover:scale-105 transition-transform duration-500 ${event.featured ? "h-52 md:h-full" : "h-52"}`}
                        />
                        <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${
                          event.status === "En cours" ? "bg-green-500 text-white" : "bg-accent text-accent-foreground"
                        }`}>
                          {event.status}
                        </span>
                      </div>
                      <CardContent className={`p-6 ${event.featured ? "md:w-1/2 flex flex-col justify-center" : ""}`}>
                        <h2 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                          {event.title}
                        </h2>
                        <p className="text-sm text-muted-foreground mb-4">{event.description}</p>
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-4">
                          <span className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" /> {event.date}
                          </span>
                          <span className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" /> {event.location}
                          </span>
                        </div>
                        {event.link && (
                          <Link to={event.link}>
                            <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/5">
                              En savoir plus <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>
                        )}
                      </CardContent>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Events;
