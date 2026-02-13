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
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/20" />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 pt-20 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto"
        >
          {/* Trust Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg">
              <div className="flex text-accent">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current text-accent/80" />
              </div>
              <span className="text-white font-semibold text-sm">4.8/5</span>
              <span className="text-white/40 mx-2">•</span>
              <Users className="w-4 h-4 text-white/80" />
              <span className="text-white/90 text-sm font-medium">20 000 lecteurs passionnés</span>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 leading-[1.15] drop-shadow-lg max-w-3xl mx-auto">
            Le magazine N°1 de la pêche au coup <br className="hidden md:inline" />depuis 20 ans
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto font-light drop-shadow-md">
            L'expertise technique et la passion au service de votre réussite au bord de l'eau.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg rounded-full w-full sm:w-auto shadow-xl hover:scale-105 transition-transform font-bold"
              onClick={() => document.getElementById('subscribe')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Je m'abonne
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-white hover:bg-white/90 text-foreground border-white px-8 py-6 text-lg rounded-full w-full sm:w-auto hover:scale-105 transition-transform font-medium"
              onClick={() => document.getElementById('magazine')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Découvrir le numéro
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
