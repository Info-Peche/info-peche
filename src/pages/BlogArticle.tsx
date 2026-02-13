import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import SideCart from "@/components/SideCart";

interface FullArticle {
  id: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
  isFree: boolean;
  content: string;
  teaserContent: string;
}

const articlesData: Record<string, FullArticle> = {
  "technique-amorce-riviere": {
    id: "technique-amorce-riviere",
    title: "Les secrets d'une amorce réussie en rivière",
    category: "Technique",
    date: "10 Février 2026",
    readTime: "8 min",
    image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1200&h=600&fit=crop",
    isFree: true,
    teaserContent: "",
    content: `La pêche au coup en rivière demande une approche spécifique de l'amorçage. Contrairement à l'étang où l'amorce peut reposer tranquillement sur le fond, le courant impose des contraintes majeures qu'il faut savoir maîtriser.

## La granulométrie : le facteur clé

En rivière, la granulométrie de votre amorce est déterminante. Une amorce trop fine sera emportée par le courant avant même d'atteindre le fond. À l'inverse, une amorce trop grossière ne diffusera pas correctement ses attractants.

L'idéal est de travailler avec un mélange à double granulométrie : une base fine pour la diffusion aromatique et des éléments plus grossiers (terre de rivière, graviers fins) pour le lestage.

## Le taux d'humidité

C'est probablement l'erreur la plus courante chez les débutants. En rivière, l'amorce doit être légèrement plus humide qu'en étang. Elle doit former des boules compactes qui résisteront à l'impact avec la surface de l'eau mais se déliteront progressivement au fond.

**Astuce de pro :** Préparez votre amorce la veille au soir et laissez-la reposer toute la nuit. Les farines absorberont l'eau de manière uniforme et vous obtiendrez une texture parfaitement homogène.

## Les ingrédients indispensables

- **Terre de rivière** : 30 à 40% du mélange pour le lestage
- **Chapelure brune** : Base nutritive et coloration naturelle
- **PV1** : Pour le pouvoir collant
- **Coriandre moulue** : Attractant naturel très efficace en eau courante
- **Chènevis grillé concassé** : Apport en huiles et graines pour retenir le poisson

## La stratégie d'amorçage

Commencez par un amorçage massif de 10 à 15 boules serrées, lancées légèrement en amont de votre coup. Le courant les déposera naturellement sur votre zone de pêche. Ensuite, rappel régulier toutes les 10 minutes avec 2 à 3 petites boules.

En compétition, cette stratégie peut faire la différence entre une pêche correcte et un résultat exceptionnel.`,
  },
  "competition-championnat-france": {
    id: "competition-championnat-france",
    title: "Retour sur le Championnat de France 2025",
    category: "Compétition",
    date: "5 Février 2026",
    readTime: "12 min",
    image: "https://images.unsplash.com/photo-1504309092620-4d0ec726efa4?w=1200&h=600&fit=crop",
    isFree: false,
    teaserContent: `Le Championnat de France de pêche au coup 2025 restera dans les annales. Organisé sur les magnifiques parcours du canal de Bourgogne, cette édition a offert un spectacle de très haut niveau avec des conditions météo changeantes qui ont redistribué les cartes.

## Un plateau exceptionnel

Pas moins de 180 compétiteurs venus de toute la France se sont retrouvés pour cette édition. Parmi eux, les favoris habituels mais aussi de nombreuses surprises venues des divisions régionales...

**Pour découvrir la suite de cet article — stratégies gagnantes, interviews exclusives et classement complet — retrouvez-le dans votre magazine Info Pêche.**`,
    content: "",
  },
  "materiel-cannes-2026": {
    id: "materiel-cannes-2026",
    title: "Comparatif : les meilleures cannes au coup 2026",
    category: "Matériel",
    date: "28 Janvier 2026",
    readTime: "10 min",
    image: "https://images.unsplash.com/photo-1485833077787-4535e3f31b1a?w=1200&h=600&fit=crop",
    isFree: false,
    teaserContent: `Chaque année, les fabricants rivalisent d'ingéniosité pour proposer des cannes toujours plus légères, plus rigides et mieux équilibrées. Pour cette saison 2026, nous avons sélectionné et testé en conditions réelles 15 modèles des marques les plus réputées.

## Nos critères de test

Chaque canne a été évaluée sur 5 critères : poids, rigidité, équilibre en main, finitions et rapport qualité-prix. Nos testeurs — trois compétiteurs de niveau national — ont passé plus de 40 heures au bord de l'eau pour vous livrer un verdict impartial...

**Envie de connaître nos résultats, notre coup de cœur et le meilleur rapport qualité-prix ? Retrouvez le comparatif complet dans Info Pêche.**`,
    content: "",
  },
  "debutant-peche-au-coup": {
    id: "debutant-peche-au-coup",
    title: "Débuter la pêche au coup : le guide complet",
    category: "Débutant",
    date: "20 Janvier 2026",
    readTime: "15 min",
    image: "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=1200&h=600&fit=crop",
    isFree: true,
    teaserContent: "",
    content: `Vous souhaitez vous lancer dans la pêche au coup ? Excellente idée ! C'est la technique la plus accessible et la plus conviviale pour découvrir le monde de la pêche. Voici tout ce qu'il faut savoir pour bien débuter.

## Qu'est-ce que la pêche au coup ?

La pêche au coup consiste à attirer les poissons sur un point précis (le "coup") grâce à de l'amorce, puis à les capturer avec une canne sans moulinet. C'est une pêche de finesse, de patience et d'observation.

## Le matériel de base

Pour débuter, pas besoin d'investir des fortunes. Voici l'essentiel :

- **Une canne télescopique de 4 à 6 mètres** : Légère et maniable, parfaite pour apprendre
- **Des lignes montées** : Achetez-en quelques-unes prêtes à l'emploi (taille 16 à 20)
- **Un seau à amorce** : Pour préparer et transporter votre mélange
- **Une bourriche** : Pour conserver vos prises
- **Un dégorgeoir** : Indispensable pour décrocher les poissons sans les blesser

## Votre première amorce

Pour débuter, restez simple. Un mélange chapelure/terre suffit amplement. Ajoutez un peu d'eau progressivement jusqu'à obtenir des boules qui tiennent dans la main mais se délitent au fond.

## Choisir son poste

Observez l'eau avant de vous installer. Cherchez les zones calmes, les bordures avec de la végétation, les arrivées d'eau. Les poissons s'y tiennent naturellement.

## Les premières touches

Soyez patient ! Les premiers poissons arrivent généralement 15 à 30 minutes après l'amorçage. Surveillez votre flotteur : la moindre anomalie dans sa position (enfoncement, déplacement latéral) indique une touche.

## Progresser rapidement

Le meilleur conseil : pêchez régulièrement, même des sessions courtes de 2 heures. L'expérience au bord de l'eau est irremplaçable. Et n'hésitez pas à observer les pêcheurs expérimentés autour de vous !`,
  },
  "reportage-etang-mythique": {
    id: "reportage-etang-mythique",
    title: "Reportage : 48h sur un étang mythique du Morvan",
    category: "Reportage",
    date: "15 Janvier 2026",
    readTime: "20 min",
    image: "https://images.unsplash.com/photo-1472396961693-142e6e269027?w=1200&h=600&fit=crop",
    isFree: false,
    teaserContent: `Il est des lieux qui font rêver tous les pêcheurs au coup. L'étang des Settons, niché au cœur du Parc Naturel du Morvan, en fait partie. Notre équipe a eu le privilège d'y passer 48 heures pour un reportage exclusif.

## Arrivée au crépuscule

C'est sous une lumière dorée que nous avons découvert ce plan d'eau légendaire. 360 hectares d'une eau cristalline bordée de forêts centenaires. L'ambiance est immédiatement saisissante...

**La suite de ce reportage — pêche de nuit, prises record et rencontres avec les gardiens du lac — est à retrouver dans votre magazine Info Pêche.**`,
    content: "",
  },
};

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? articlesData[slug] : null;

  if (!article) {
    return (
      <CartProvider>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="pt-28 pb-20 text-center">
            <h1 className="text-3xl font-bold mb-4">Article introuvable</h1>
            <Link to="/blog">
              <Button variant="outline">Retour au blog</Button>
            </Link>
          </main>
          <Footer />
        </div>
      </CartProvider>
    );
  }

  const displayContent = article.isFree ? article.content : article.teaserContent;

  return (
    <CartProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <SideCart />

        <main className="pt-24 pb-20">
          {/* Hero Image */}
          <div className="w-full h-64 md:h-96 overflow-hidden">
            <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
          </div>

          <article className="container mx-auto px-4 max-w-3xl -mt-16 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl shadow-xl p-8 md:p-12"
            >
              {/* Meta */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-6">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold text-xs">
                  {article.category}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> {article.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" /> {article.readTime}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8 leading-tight">
                {article.title}
              </h1>

              {/* Article Content */}
              <div className="prose prose-lg max-w-none text-foreground/85 leading-relaxed">
                {displayContent.split("\n\n").map((paragraph, i) => {
                  if (paragraph.startsWith("## ")) {
                    return <h2 key={i} className="text-2xl font-bold text-foreground mt-8 mb-4">{paragraph.replace("## ", "")}</h2>;
                  }
                  if (paragraph.startsWith("- **")) {
                    const items = paragraph.split("\n").filter(Boolean);
                    return (
                      <ul key={i} className="list-disc pl-6 space-y-2 my-4">
                        {items.map((item, j) => (
                          <li key={j} dangerouslySetInnerHTML={{ __html: item.replace(/^- /, "").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                        ))}
                      </ul>
                    );
                  }
                  if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
                    return <p key={i} className="font-semibold my-4" dangerouslySetInnerHTML={{ __html: paragraph.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />;
                  }
                  return <p key={i} className="my-4" dangerouslySetInnerHTML={{ __html: paragraph.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />;
                })}
              </div>

              {/* Paywall CTA for non-free articles */}
              {!article.isFree && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-12 relative"
                >
                  <div className="absolute -top-20 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent" />
                  <div className="bg-muted rounded-xl p-8 text-center border border-border">
                    <Lock className="h-8 w-8 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      Envie de lire la suite ?
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Cet article complet est disponible dans votre magazine Info Pêche. Abonnez-vous pour accéder à tous nos contenus exclusifs.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-8"
                        onClick={() => {
                          window.location.href = "/#subscribe";
                        }}
                      >
                        Voir les offres d'abonnement
                      </Button>
                      <Link to="/boutique">
                        <Button variant="outline" className="rounded-full px-8">
                          Acheter ce numéro
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Back link */}
              <div className="mt-10 pt-6 border-t border-border">
                <Link to="/blog" className="inline-flex items-center text-primary font-medium hover:underline">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Retour au blog
                </Link>
              </div>
            </motion.div>
          </article>
        </main>

        <Footer />
      </div>
    </CartProvider>
  );
};

export default BlogArticle;
