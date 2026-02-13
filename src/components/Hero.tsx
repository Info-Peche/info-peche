import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
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
        <div className="absolute inset-0 bg-black/30 md:bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-background" />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 pt-20 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <span className="inline-block py-1 px-3 rounded-full bg-accent/90 text-white text-sm font-medium mb-6 backdrop-blur-sm shadow-lg">
            Le Magazine N°1 de la Pêche au Coup
          </span>
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight drop-shadow-md">
            Maîtrisez l'Art de la <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">
              Pêche au Coup
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto font-light drop-shadow-sm">
            Découvrez les meilleures techniques, coins secrets et conseils d'experts pour vivre votre passion.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-accent hover:bg-accent/90 text-white px-8 py-6 text-lg rounded-full w-full sm:w-auto shadow-xl hover:scale-105 transition-transform"
              onClick={() => document.getElementById('magazine')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Découvrir le dernier numéro
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 px-8 py-6 text-lg rounded-full backdrop-blur-sm w-full sm:w-auto hover:scale-105 transition-transform"
              onClick={() => document.getElementById('subscribe')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Voir les offres
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
