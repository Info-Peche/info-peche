import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const FinalCTA = () => {
  return (
    <section className="py-24 bg-primary text-white relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="container px-4 mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 leading-tight">
            Prêt à passer au niveau supérieur ?
          </h2>
          <p className="text-white/80 text-xl mb-10 leading-relaxed">
            Rejoignez les 20 000 passionnés qui font confiance à Info-Pêche pour progresser et vivre leur passion chaque mois. <strong className="text-white">Votre premier numéro arrive sous 48h.</strong>
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 px-10 py-7 text-lg font-bold rounded-full shadow-xl hover:scale-105 transition-transform"
              onClick={() => document.getElementById('subscribe')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Je m'abonne maintenant
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <span className="text-white/60 text-sm">
              Sans engagement • Annulation libre
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;
