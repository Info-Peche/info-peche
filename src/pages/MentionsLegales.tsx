import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SideCart from "@/components/SideCart";
import { usePageSeo } from "@/hooks/usePageSeo";

const MentionsLegales = () => {
  usePageSeo({
    title: "Mentions Légales — Info Pêche",
    description: "Mentions légales du site Info Pêche : éditeur, hébergeur, conditions d'utilisation et politique de confidentialité.",
    canonical: "/mentions-legales",
  });
  return (
  <div className="min-h-screen bg-background">
    <Header />
    <SideCart />
    <main className="pt-28 pb-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-10">Mentions Légales</h1>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">1. Éditeur du site</h2>
            <p>
              Le site <strong className="text-foreground">info-peche.fr</strong> est édité par :<br />
              <strong className="text-foreground">INFO PÊCHE</strong><br />
              20, avenue des Lauriers Roses<br />
              13600 La Ciotat – France<br /><br />
              Directeur de la publication : <strong className="text-foreground">Jean-François Darnet</strong><br />
              Email : <a href="mailto:jeanfrancois.darnet@info-peche.fr" className="text-primary hover:underline">jeanfrancois.darnet@info-peche.fr</a><br />
              Téléphone : <a href="tel:+33673694733" className="text-primary hover:underline">06 73 69 47 33</a><br />
              N° de Commission Paritaire des Publications et Agences de Presse (CPPAP) : en cours
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">2. Hébergement</h2>
            <p>
              Ce site est hébergé par :<br />
              <strong className="text-foreground">Netlify, Inc.</strong><br />
              512 2nd Street, Suite 200 – San Francisco, CA 94107, États-Unis<br />
              Site web : <a href="https://www.netlify.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.netlify.com</a><br /><br />
              Les données applicatives (base de données, authentification, stockage de fichiers) sont hébergées par <strong className="text-foreground">Supabase</strong> sur des serveurs situés en <strong className="text-foreground">Union Européenne</strong>, conformément au Règlement Général sur la Protection des Données (RGPD).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">3. Propriété intellectuelle</h2>
            <p>
              L'ensemble des contenus présents sur ce site — textes, articles, photographies, illustrations, logos, maquettes, graphismes — est protégé par le droit d'auteur et le droit de la propriété intellectuelle (articles L.111-1 et suivants du Code de la propriété intellectuelle).
            </p>
            <p className="mt-2">
              Toute reproduction, représentation, diffusion ou exploitation, même partielle, des contenus du site, par quelque procédé que ce soit, est strictement interdite sans l'autorisation écrite préalable d'Info Pêche. Le non-respect de cette interdiction constitue une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle.
            </p>
            <p className="mt-2">
              Les marques, logos et signes distinctifs reproduits sur ce site sont la propriété exclusive de leurs titulaires respectifs.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">4. Protection des données personnelles (RGPD)</h2>
            <p>
              Conformément au Règlement (UE) 2016/679 du 27 avril 2016 (RGPD) et à la loi n° 78-17 du 6 janvier 1978 modifiée (Loi Informatique et Libertés), Info Pêche s'engage à protéger vos données personnelles.
            </p>
            <h3 className="font-semibold text-foreground mt-4 mb-2">Données collectées</h3>
            <p>
              Lors de votre navigation et de vos commandes, nous sommes amenés à collecter les données suivantes : nom, prénom, adresse e-mail, adresse postale, numéro de téléphone. Ces données sont nécessaires au traitement de vos commandes, à la gestion de vos abonnements et à l'envoi de communications relatives à nos publications.
            </p>
            <h3 className="font-semibold text-foreground mt-4 mb-2">Base légale du traitement</h3>
            <p>
              Le traitement de vos données repose sur l'exécution du contrat (commande, abonnement) et sur votre consentement pour les communications commerciales.
            </p>
            <h3 className="font-semibold text-foreground mt-4 mb-2">Durée de conservation</h3>
            <p>
              Vos données sont conservées pendant la durée de la relation commerciale et pendant une durée de 3 ans à compter de votre dernière interaction avec Info Pêche, sauf obligation légale de conservation plus longue.
            </p>
            <h3 className="font-semibold text-foreground mt-4 mb-2">Vos droits</h3>
            <p>
              Vous disposez d'un droit d'accès, de rectification, de suppression, de limitation du traitement, de portabilité et d'opposition sur vos données personnelles. Pour exercer ces droits, contactez-nous à : <a href="mailto:jeanfrancois.darnet@info-peche.fr" className="text-primary hover:underline">jeanfrancois.darnet@info-peche.fr</a>.
            </p>
            <p className="mt-2">
              Vous pouvez également introduire une réclamation auprès de la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.cnil.fr</a>).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">5. Cookies</h2>
            <p>
              Ce site utilise uniquement des cookies techniques strictement nécessaires au bon fonctionnement du site (session utilisateur, panier d'achat, préférences d'affichage). Aucun cookie publicitaire, de profilage ou de suivi tiers n'est déposé.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">6. Responsabilité</h2>
            <p>
              Info Pêche s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur ce site, mais ne saurait garantir l'exhaustivité ou l'absence d'erreurs. Info Pêche décline toute responsabilité en cas d'interruption du site, de survenance de bugs ou d'inexactitudes dans les informations diffusées.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">7. Liens hypertextes</h2>
            <p>
              Le site peut contenir des liens vers des sites tiers. Info Pêche n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu ou à leur politique de protection des données.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">8. Droit applicable</h2>
            <p>
              Les présentes mentions légales sont régies par le droit français. Tout litige relatif à l'utilisation du site sera soumis à la compétence exclusive des tribunaux d'Aix-en-Provence.
            </p>
          </section>

          <p className="text-xs text-muted-foreground/60 pt-4 border-t border-border">
            Dernière mise à jour : mars 2026
          </p>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);
};

export default MentionsLegales;
