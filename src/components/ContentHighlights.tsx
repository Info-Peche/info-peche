import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import featureTechniques from "@/assets/feature-techniques.jpg";
import featureMateriel from "@/assets/feature-materiel.jpg";
import featureCompetition from "@/assets/feature-competition.jpg";

const categories = [
  {
    image: featureTechniques,
    title: "Techniques & Tactiques",
    description: "Des dossiers fouillés par les meilleurs compétiteurs : amorçage, esches, montages, stratégies de pêche à la grande canne, à l'anglaise et au feeder.",
  },
  {
    image: featureMateriel,
    title: "Tests Matériel",
    description: "Des bancs d'essai impartiaux et détaillés pour vous aider à choisir le meilleur équipement, du moulinet à la canne, en passant par les accessoires.",
  },
  {
    image: featureCompetition,
    title: "Compétitions & Reportages",
    description: "Vivez les championnats du monde et les épreuves nationales comme si vous y étiez grâce à nos reportages photo exclusifs.",
  },
];

const ContentHighlights = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-bold tracking-widest uppercase text-sm">
            Dans Chaque Numéro
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mt-2 mb-4 text-foreground">
            Un contenu riche et exclusif
          </h2>
          <p className="text-muted-foreground text-lg">
            Chaque mois, retrouvez des rubriques pensées pour vous faire progresser et nourrir votre passion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((cat, index) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              viewport={{ once: true }}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-2xl mb-6">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <h3 className="absolute bottom-4 left-4 right-4 text-white text-xl font-serif font-bold">
                  {cat.title}
                </h3>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-3">
                {cat.description}
              </p>
              <span className="inline-flex items-center gap-1 text-primary font-semibold text-sm group-hover:gap-2 transition-all">
                En savoir plus <ArrowRight className="w-4 h-4" />
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContentHighlights;
