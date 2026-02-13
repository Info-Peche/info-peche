import { motion } from "framer-motion";
import { BookOpen, Award, Calendar } from "lucide-react";
import founderImage from "@/assets/storytelling-founder.jpg";

const stats = [
  { icon: Calendar, value: "20 ans", label: "d'expertise" },
  { icon: BookOpen, value: "200+", label: "numéros publiés" },
  { icon: Award, value: "50+", label: "champions interviewés" },
];

const Storytelling = () => {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Image side */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="relative"
          >
            <img
              src={founderImage}
              alt="L'un des fondateurs d'Info-Pêche au bord de l'eau"
              className="w-full rounded-2xl shadow-xl object-cover aspect-square"
            />
            {/* Floating stat card */}
            <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-2xl border border-border p-6 max-w-[220px]">
              <p className="text-4xl font-serif font-bold text-primary">2 amis</p>
              <p className="text-sm text-muted-foreground font-medium">
                unis par la même passion depuis plus de 20 ans
              </p>
            </div>
          </motion.div>

          {/* Text side */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <span className="text-primary font-bold tracking-widest uppercase text-sm">
              Notre Histoire
            </span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground leading-tight">
              Une amitié, une passion,<br />un magazine
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-lg">
              <p>
                Tout est parti d'une rencontre au bord de l'eau. <strong className="text-foreground">Deux amis, deux pêcheurs passionnés</strong>, partageant le même constat : il manquait en France un magazine entièrement dédié à la pêche au coup, écrit par ceux qui la vivent chaque jour.
              </p>
              <p>
                Ensemble, ils ont lancé Info-Pêche avec une poignée de pages et un budget serré, mais une ambition démesurée : <strong className="text-foreground">créer la référence absolue pour les pêcheurs au coup</strong>. À force de reportages sur les berges, de tests rigoureux et de rencontres avec les plus grands champions, le magazine s'est imposé numéro après numéro.
              </p>
              <p>
                20 ans plus tard, cette aventure née de l'amitié continue de grandir. Chaque mois, c'est toujours la même passion qui guide la rédaction — celle de <strong className="text-foreground">partager, transmettre et faire progresser</strong> des milliers de lecteurs fidèles.
              </p>
            </div>

            {/* Inline stats */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-border">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon className="w-6 h-6 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Storytelling;
