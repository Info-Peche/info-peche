import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Combien de numéros par an vais-je recevoir ?",
    answer: "Info-Pêche est publié 10 fois par an. Avec un abonnement 1 an, vous recevrez donc 10 numéros, et 20 numéros pour un abonnement 2 ans.",
  },
  {
    question: "Puis-je offrir un abonnement en cadeau ?",
    answer: "Bien sûr ! L'abonnement cadeau est l'un de nos best-sellers. Il vous suffit de renseigner l'adresse du destinataire lors de votre commande. Une carte cadeau personnalisée sera incluse dans le premier envoi.",
  },
  {
    question: "Quels sont les délais de livraison ?",
    answer: "En France métropolitaine, le premier numéro est expédié sous 48h après validation de votre commande. Les numéros suivants arrivent dès leur parution, généralement en début de mois. Les frais de livraison sont inclus dans tous nos abonnements.",
  },
  {
    question: "Puis-je résilier mon abonnement à tout moment ?",
    answer: "Oui, vous pouvez résilier votre abonnement à tout moment en contactant notre service client. Vous continuerez à recevoir les numéros déjà payés. Nous proposons également un remboursement au prorata des numéros restants.",
  },
  {
    question: "Le magazine est-il disponible en version numérique ?",
    answer: "Oui ! Tous nos abonnements incluent l'accès à la version numérique du magazine, consultable sur smartphone, tablette et ordinateur. Vous pouvez lire vos numéros où que vous soyez, même sans connexion internet.",
  },
  {
    question: "Comment contacter la rédaction ?",
    answer: "Vous pouvez nous joindre par email à contact@info-peche.fr ou par téléphone. Notre équipe répond sous 24h en jours ouvrés. Nous sommes aussi actifs sur nos réseaux sociaux (Facebook, Instagram) pour répondre à vos questions.",
  },
  {
    question: "Le paiement est-il sécurisé ?",
    answer: "Absolument. Tous les paiements sont traités par Stripe, leader mondial du paiement en ligne. Vos données bancaires ne transitent jamais par nos serveurs et sont chiffrées de bout en bout.",
  },
];

const FAQ = () => {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container px-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <span className="text-primary font-bold tracking-widest uppercase text-sm">
            Questions Fréquentes
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mt-2 mb-4 text-foreground">
            On vous dit tout
          </h2>
          <p className="text-muted-foreground text-lg">
            Vous avez une question ? Vous trouverez sûrement la réponse ici.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-white rounded-xl border border-border px-6 shadow-sm data-[state=open]:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;
