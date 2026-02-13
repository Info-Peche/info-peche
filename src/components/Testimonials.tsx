import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    name: "Jean-Marc D.",
    location: "Loire-Atlantique (44)",
    rating: 5,
    text: "Abonné depuis 12 ans, Info-Pêche est devenu ma bible. Les dossiers techniques m'ont permis de passer un vrai cap en compétition. Indispensable !",
    highlight: "Abonné depuis 12 ans",
  },
  {
    name: "Thierry L.",
    location: "Aisne (02)",
    rating: 5,
    text: "Les tests matériel sont d'une honnêteté rare. Grâce à Info-Pêche, j'ai enfin trouvé la canne parfaite pour ma pratique. Je recommande à 100%.",
    highlight: "Tests matériel honnêtes",
  },
  {
    name: "Patrick M.",
    location: "Isère (38)",
    rating: 5,
    text: "Les reportages sur les championnats du monde sont exceptionnels. On vit l'événement comme si on y était. C'est le seul magazine que j'attends chaque mois avec impatience.",
    highlight: "Reportages exceptionnels",
  },
  {
    name: "Stéphane R.",
    location: "Gironde (33)",
    rating: 4,
    text: "J'ai découvert Info-Pêche grâce aux conseils de Monsieur Plus. Depuis, ma technique à l'anglaise s'est transformée. Le rapport qualité/prix de l'abonnement est imbattable.",
    highlight: "Technique transformée",
  },
  {
    name: "Laurent B.",
    location: "Nord (59)",
    rating: 5,
    text: "En 15 ans d'abonnement, je n'ai jamais été déçu. Les articles sont toujours pertinents et les photos magnifiques. Info-Pêche, c'est la référence.",
    highlight: "15 ans d'abonnement",
  },
];

const Testimonials = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const paginate = useCallback((dir: number) => {
    setDirection(dir);
    setCurrent((prev) => {
      const next = prev + dir;
      if (next < 0) return testimonials.length - 1;
      if (next >= testimonials.length) return 0;
      return next;
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => paginate(1), 6000);
    return () => clearInterval(timer);
  }, [paginate]);

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 200 : -200,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir < 0 ? 200 : -200,
      opacity: 0,
    }),
  };

  const t = testimonials[current];

  return (
    <section className="py-24 bg-secondary/30 overflow-hidden">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-bold tracking-widest uppercase text-sm">
            Avis Vérifiés
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mt-2 mb-4 text-foreground">
            Ils nous font confiance
          </h2>
          <div className="flex justify-center items-center gap-2">
            <div className="flex text-accent">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current" />
              ))}
            </div>
            <span className="font-bold text-foreground">4.8/5</span>
            <span className="text-muted-foreground">— Plus de 3 200 avis</span>
          </div>
        </div>

        <div className="relative max-w-3xl mx-auto">
          {/* Navigation buttons */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute -left-4 md:-left-16 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg border border-border hover:bg-secondary rounded-full w-10 h-10"
            onClick={() => paginate(-1)}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-4 md:-right-16 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg border border-border hover:bg-secondary rounded-full w-10 h-10"
            onClick={() => paginate(1)}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          {/* Testimonial Card */}
          <div className="min-h-[280px] flex items-center justify-center">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-border text-center w-full"
              >
                <Quote className="w-10 h-10 text-primary/20 mx-auto mb-4" />

                <p className="text-lg md:text-xl text-foreground leading-relaxed mb-6 italic">
                  "{t.text}"
                </p>

                <div className="flex items-center justify-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-accent fill-current" />
                  ))}
                  {[...Array(5 - t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-border" />
                  ))}
                </div>

                <p className="font-bold text-foreground">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.location}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setDirection(i > current ? 1 : -1);
                  setCurrent(i);
                }}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === current ? "bg-primary w-8" : "bg-border hover:bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
