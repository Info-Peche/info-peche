import { motion } from "framer-motion";
import { Camera, Trophy, Fish, Calendar, Users, ExternalLink, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SideCart from "@/components/SideCart";

const species = [
  { name: "Gardon", latin: "Rutilus rutilus", image: "/images/fish/gardon.jpg" },
  { name: "Brème commune", latin: "Abramis brama", image: "/images/fish/breme.jpg" },
  { name: "Ide", latin: "Leuciscus idus", image: "/images/fish/ide.jpg" },
  { name: "Carassin commun", latin: "Carassius carassius", image: "/images/fish/carassin.jpg" },
  { name: "Tanche", latin: "Tinca tinca", image: "/images/fish/tanche.jpg" },
  { name: "Barbeau commun", latin: "Barbus barbus", image: "/images/fish/barbeau.jpg" },
  { name: "Chevesne", latin: "Leuciscus cephalus", image: "/images/fish/chevesne.jpg" },
  { name: "Rotengle", latin: "Scardinius erythrophthalmus", image: "/images/fish/rotengle.jpg" },
];

const partners = [
  "Sensas", "Shimano", "Fun Fishing", "Daiwa", "Garbolino", "Champion Feed", "Milo", "Nytro", "Cresta"
];

const SpecimenTrophy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SideCart />

      <main className="pt-28 pb-20">
        {/* Hero */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))]/10 via-accent/5 to-background" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto text-center"
            >
              <img
                src="/images/specimen-trophy.png"
                alt="Specimen Trophy"
                className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-8 rounded-full shadow-xl"
              />
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
                Specimen Trophy
              </h1>
              <p className="text-xl text-primary font-semibold mb-4">
                La chasse aux poissons blancs spécimens
              </p>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
                Une épreuve unique destinée à promouvoir la pêche des poissons blancs spécimens – hors carpe. 
                Envoyez vos photos de belles prises, gagnez des lots chaque mois et qualifiez-vous 
                pour la grande finale en mai 2027&nbsp;!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="https://concours.app.do/specimentrophy" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold rounded-full px-8 shadow-lg">
                    <Camera className="w-5 h-5 mr-2" />
                    Envoyer ma photo
                  </Button>
                </a>
                <a href="https://www.facebook.com/specimentrophy" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/5 font-bold rounded-full px-8">
                    <Facebook className="w-5 h-5 mr-2" />
                    Page Facebook
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Principe */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Comment ça marche ?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Camera,
                  step: "1",
                  title: "Envoyez vos photos",
                  description: "Photographiez vos plus belles prises parmi les 8 espèces éligibles et soumettez-les via le formulaire en ligne.",
                },
                {
                  icon: Trophy,
                  step: "2",
                  title: "Gagnez chaque mois",
                  description: "Chaque fin de mois, le jury Info Pêche désigne un vainqueur qui remporte un lot offert par nos partenaires.",
                },
                {
                  icon: Users,
                  step: "3",
                  title: "Finale Mai 2027",
                  description: "Les 20 meilleurs pêcheurs s'affrontent sur deux jours, en lac et en rivière, pour décrocher le titre.",
                },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full border-border/50 hover:shadow-lg transition-shadow text-center">
                    <CardContent className="p-6">
                      <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-primary font-bold text-lg">{item.step}</span>
                      </div>
                      <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Espèces */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-10">
              <Fish className="w-10 h-10 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-foreground mb-3">8 Espèces Éligibles</h2>
              <p className="text-muted-foreground">Exclusivement des poissons blancs spécimens – hors carpe</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {species.map((sp) => (
                <Card key={sp.name} className="border-border/50 overflow-hidden group hover:shadow-lg transition-shadow">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={sp.image}
                      alt={sp.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm font-semibold text-foreground">{sp.name}</p>
                    <p className="text-xs text-muted-foreground italic mt-1">({sp.latin})</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Critères */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Critères de Sélection</h2>
            <div className="space-y-4">
              {[
                { emoji: "📏", text: "La taille de la prise" },
                { emoji: "📸", text: "La qualité de la photo" },
                { emoji: "🐟", text: "Le respect du poisson" },
              ].map((item) => (
                <Card key={item.text} className="border-border/50">
                  <CardContent className="p-5 flex items-center gap-4">
                    <span className="text-2xl">{item.emoji}</span>
                    <p className="font-medium text-foreground">{item.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Finale */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <Calendar className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-foreground mb-4">Grande Finale – Mai 2027</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              À l'issue des sélections, 20 pêcheurs seront retenus pour la grande finale du Specimen Trophy.
              Elle se déroulera sur deux jours et sur deux parcours – l'un en lac, l'autre en rivière.
              Un grand vainqueur au classement général ainsi qu'un gagnant pour chacune des 8 espèces seront couronnés.
            </p>
            <p className="text-sm text-muted-foreground italic">
              Saison de sélection : juillet 2025 – février 2027
            </p>
          </div>
        </section>

        {/* Partenaires */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-foreground mb-3">Nos Partenaires</h2>
            <p className="text-muted-foreground mb-8">Merci à nos partenaires pour leur soutien dans la promotion de cette pêche</p>
            <div className="flex flex-wrap justify-center gap-3">
              {partners.map((p) => (
                <span key={p} className="bg-muted px-4 py-2 rounded-full text-sm font-medium text-foreground">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">Participez maintenant !</h2>
            <p className="text-muted-foreground mb-8">
              Envoyez vos photos de belles prises et tentez de remporter un lot chaque mois.
            </p>
            <a href="https://concours.app.do/specimentrophy" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold rounded-full px-10 shadow-lg">
                <ExternalLink className="w-5 h-5 mr-2" />
                Envoyer sa photo de belle prise
              </Button>
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SpecimenTrophy;
