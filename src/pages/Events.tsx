import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import SideCart from "@/components/SideCart";

const events = [
  {
    id: "salon-international-peches-au-coup",
    title: "Salon International des Pêches au Coup",
    description: "Le rendez-vous incontournable des passionnés de pêche au coup. Exposants, démonstrations, conférences et rencontres avec les champions.",
    date: "15–17 Mars 2026",
    location: "Parc des Expositions, Lyon",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop",
    status: "À venir",
  },
  {
    id: "coupe-info-peche",
    title: "Coupe Info Pêche 2026",
    description: "Notre compétition annuelle ouverte à tous les abonnés. Convivialité, bonne humeur et lots exceptionnels à gagner.",
    date: "20–21 Juin 2026",
    location: "Lac de Saint-Cassien, Var",
    image: "https://images.unsplash.com/photo-1504309092620-4d0ec726efa4?w=600&h=400&fit=crop",
    status: "À venir",
  },
];

const Events = () => {
  return (
    <CartProvider>
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
                >
                  <Card className="group overflow-hidden border-border/50 hover:shadow-xl transition-all duration-300 h-full">
                    <div className="relative overflow-hidden">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 right-3 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-bold">
                        {event.status}
                      </span>
                    </div>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                        {event.title}
                      </h2>
                      <p className="text-sm text-muted-foreground mb-4">{event.description}</p>
                      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" /> {event.date}
                        </span>
                        <span className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" /> {event.location}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </CartProvider>
  );
};

export default Events;
