import { motion } from "framer-motion";
import { BookOpen, Award, Calendar } from "lucide-react";
import storyImage from "@/assets/storytelling-history.jpg";

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
              src={storyImage}
              alt="La rédaction Info-Pêche à ses débuts"
              className="w-full rounded-2xl shadow-xl object-cover aspect-square"
            />
            {/* Floating stat card */}
            <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-2xl border border-border p-6 max-w-[200px]">
              <p className="text-4xl font-serif font-bold text-primary">20</p>
              <p className="text-sm text-muted-foreground font-medium">
                ans de passion partagée avec nos lecteurs
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
              Nés de la passion,<br />guidés par l'expertise
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-lg">
              <p>
                Tout a commencé il y a 20 ans, autour d'une idée simple : créer <strong className="text-foreground">le magazine que les pêcheurs au coup méritaient vraiment</strong>. Un magazine écrit par des passionnés, pour des passionnés.
              </p>
              <p>
                Depuis, notre rédaction sillonne les berges de France et d'Europe pour vous rapporter les meilleures techniques, tester le matériel le plus récent et couvrir les compétitions les plus prestigieuses.
              </p>
              <p>
                De « Monsieur Plus » aux reportages exclusifs sur les Championnats du monde, chaque numéro est le fruit d'un travail minutieux, guidé par une seule ambition : <strong className="text-foreground">vous aider à progresser et à vivre pleinement votre passion</strong>.
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
