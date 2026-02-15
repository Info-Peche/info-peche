import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Users } from "lucide-react";
import heroImage from "@/assets/hero-fishing.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Pêcheur au coup au bord d'une rivière paisible"
          className="w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/60" />
      </div>

      {/* Subtle animated particles / light effect */}
      <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ y: [0, 15, 0], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/15 rounded-full blur-[100px]"
        />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 pt-20 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="max-w-5xl mx-auto"
        >
          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex justify-center mb-10"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-lg px-5 py-2.5 rounded-full border border-white/15 shadow-lg">
              <div className="flex text-accent">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-white font-bold text-sm">4.8/5</span>
              <span className="text-white/30 mx-1">•</span>
              <Users className="w-4 h-4 text-white/70" />
              <span className="text-white/80 text-sm font-medium">20 000 lecteurs passionnés</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold mb-8 leading-[1.1] drop-shadow-lg max-w-4xl mx-auto"
          >
            Le magazine <span className="text-accent">N°1</span> de la pêche au coup depuis 20 ans
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-xl md:text-2xl text-white/85 mb-12 max-w-2xl mx-auto font-light drop-shadow-md leading-relaxed"
          >
            L'expertise technique et la passion au service de votre réussite au bord de l'eau.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white px-10 py-7 text-lg rounded-full w-full sm:w-auto shadow-glow-primary hover:scale-105 transition-all duration-300 font-bold"
              onClick={() => document.getElementById('subscribe')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Je m'abonne
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 px-10 py-7 text-lg rounded-full w-full sm:w-auto hover:scale-105 transition-all duration-300 font-medium backdrop-blur-sm"
              onClick={() => document.getElementById('magazine')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Découvrir le numéro
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-[5]" />
    </section>
  );
};

export default Hero;
