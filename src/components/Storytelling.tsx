import { motion } from "framer-motion";
import { BookOpen, Award, Youtube, Calendar } from "lucide-react";
import nicolasImage from "@/assets/nicolas-beroud.jpg";

const stats = [
  { icon: Calendar, value: "40 ans", label: "de passion" },
  { icon: BookOpen, value: "300+", label: "numéros dirigés" },
  { icon: Youtube, value: "17k+", label: "abonnés YouTube" },
  { icon: Award, value: "5 magazines", label: "créés ou dirigés" },
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
              src={nicolasImage}
              alt="Nicolas Béroud, rédacteur en chef d'Info Pêche, au bord de l'eau"
              className="w-full rounded-2xl shadow-xl object-cover aspect-[3/4]"
            />
            {/* Floating stat card */}
            <div className="absolute -bottom-6 right-0 md:-right-6 bg-white rounded-xl shadow-2xl border border-border p-6 max-w-[240px]">
              <p className="text-4xl font-serif font-bold text-primary">40 ans</p>
              <p className="text-sm text-muted-foreground font-medium">
                de passion pour la pêche et le journalisme halieutique
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
              Le Rédacteur en Chef
            </span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground leading-tight">
              Nicolas Béroud,<br />une vie au bord de l'eau
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-lg">
              <p>
                Tout a commencé en Corrèze, chez sa grand-mère, face à l'immense lac du Chastang. <strong className="text-foreground">Le jeune Nicolas attrape ses premiers gardons au blé</strong> — et c'est le début d'une passion qui ne le quittera plus.
              </p>
              <p>
                Diplômé en biologie cellulaire, il choisit pourtant le journalisme halieutique. Formé aux côtés des plus grands champions français et perfectionné en compétition en Angleterre, il devient <strong className="text-foreground">rédacteur en chef adjoint de La Pêche et les Poissons</strong> alors qu'il est encore étudiant.
              </p>
              <p>
                Suivront la création de <em>Déclic Pêche</em>, la direction de quatre autres titres, puis en 2012, <strong className="text-foreground">la naissance d'Info Pêche</strong> — le magazine qu'il avait toujours rêvé de créer : entièrement dédié à la pêche au coup, rédigé par des passionnés pour des passionnés.
              </p>
              <p>
                Aujourd'hui, Nicolas partage aussi sa passion sur sa <a href="https://www.youtube.com/@InfoPêche" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold underline underline-offset-2 hover:text-primary/80 transition-colors">chaîne YouTube</a> suivie par plus de 17 000 abonnés, avec des tutos, des lives et des reportages au bord de l'eau.
              </p>
            </div>

            {/* Inline stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-border">
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
