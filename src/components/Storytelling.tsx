import { motion } from "framer-motion";
import { BookOpen, Award, Youtube, Calendar } from "lucide-react";
import nicolasImage from "@/assets/nicolas-beroud.jpg";

const stats = [
  { icon: Calendar, value: "40 ans", label: "de passion" },
  { icon: BookOpen, value: "300+", label: "numéros dirigés" },
  { icon: Youtube, value: "16k+", label: "abonnés YouTube" },
  { icon: Award, value: "6 magazines", label: "créés ou dirigés" },
];

const Storytelling = () => {
  return (
    <section className="py-16 md:py-24 bg-white overflow-hidden">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center">
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
              className="w-full max-w-[280px] md:max-w-sm mx-auto rounded-2xl shadow-xl object-cover aspect-[3/4]"
              loading="lazy"
              decoding="async"
              width={384}
              height={512}
            />
            {/* Floating stat card */}
            <div className="absolute -bottom-4 right-4 md:-bottom-6 md:right-0 lg:-right-6 bg-white rounded-xl shadow-2xl border border-border p-4 md:p-6 max-w-[200px] md:max-w-[240px]">
              <p className="text-3xl md:text-4xl font-serif font-bold text-primary">40 ans</p>
              <p className="text-xs md:text-sm text-muted-foreground font-medium">
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
            className="space-y-4 md:space-y-6"
          >
            <span className="text-primary font-bold tracking-widest uppercase text-xs md:text-sm">
              Le Rédacteur en Chef
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground leading-tight">
              Nicolas Béroud,<br />une vie au bord de l'eau
            </h2>
            <div className="space-y-3 md:space-y-4 text-muted-foreground leading-relaxed text-base md:text-lg">
              <p>
                Tout a commencé en Corrèze, chez sa grand-mère, face à l'immense lac du Chastang. <strong className="text-foreground">Le jeune Nicolas attrape ses premiers gardons au blé</strong> — et c'est le début d'une passion qui ne le quittera plus.
              </p>
              <p>
                Diplômé en biologie cellulaire, il choisit pourtant le journalisme halieutique. Formé aux côtés des plus grands champions français et perfectionné en compétition en Angleterre, il devient <strong className="text-foreground">l'adjoint de Daniel Maury, le rédacteur emblématique de La Pêche et les Poissons</strong> alors qu'il est encore étudiant.
              </p>
              <p>
                En 1998, Nicolas crée le tout premier magazine exclusivement consacré aux techniques de pêches au coup en France <em>Déclic Pêche</em>. Il prend aussi la direction de quatre autres titres de pêche en eau douce et en mer avant de se consacrer uniquement à <strong className="text-foreground">Info Pêche à partir de 2012</strong>.
              </p>
              <p>
                Aujourd'hui, Nicolas partage aussi sa passion sur la <a href="https://www.youtube.com/@InfoPêche" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold underline underline-offset-2 hover:text-primary/80 transition-colors">chaîne YouTube Info Pêche</a> suivie par plus de 16 000 abonnés, avec des tutos, des interviews et des reportages en direct sur les plus grandes épreuves nationales et internationales.
              </p>
            </div>

            {/* Inline stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 pt-4 md:pt-6 border-t border-border">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon className="w-5 h-5 md:w-6 md:h-6 mx-auto text-primary mb-1.5 md:mb-2" />
                  <p className="text-xl md:text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p>
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
