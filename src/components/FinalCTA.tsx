import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const FinalCTA = () => {
  return (
    <section className="py-28 bg-primary text-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />

      <div className="container px-4 mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto"
        >
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-serif font-bold mb-8 leading-tight"
          >
            Prêt à passer au <span className="text-accent">niveau supérieur</span> ?
          </motion.h2>
          <p className="text-white/80 text-xl mb-12 leading-relaxed">
            Rejoignez les 20 000 passionnés qui font confiance à Info-Pêche pour progresser et vivre leur passion chaque mois. <strong className="text-white">Votre premier numéro arrive sous 48h.</strong>
          </p>
          <div className="flex items-center justify-center">
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 px-12 py-7 text-lg font-bold rounded-full shadow-glow-accent hover:scale-105 transition-all duration-300"
              onClick={() => document.getElementById('subscribe')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Je m'abonne maintenant
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;
