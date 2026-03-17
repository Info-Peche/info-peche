import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SideCart from "@/components/SideCart";
import { usePageSeo } from "@/hooks/usePageSeo";

const CGV = () => {
  usePageSeo({
    title: "Conditions Générales de Vente — Info Pêche",
    description: "Conditions générales de vente du magazine Info Pêche : abonnements, commandes, livraison, retours et remboursements.",
    canonical: "/cgv",
  });
  return (
  <div className="min-h-screen bg-background">
    <Header />
    <SideCart />
    <main className="pt-28 pb-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-10">Conditions Générales de Vente</h1>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">Article 1 — Objet</h2>
            <p>
              Les présentes Conditions Générales de Vente (CGV) régissent l'ensemble des ventes de magazines, numéros isolés, abonnements papier et numériques proposés par <strong className="text-foreground">Info Pêche</strong> sur le site <strong className="text-foreground">info-peche.fr</strong>.
            </p>
            <p className="mt-2">
              Toute commande passée sur le site implique l'acceptation pleine et entière des présentes CGV.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">Article 2 — Identification du vendeur</h2>
            <p>
              <strong className="text-foreground">INFO PÊCHE</strong><br />
              20, avenue des Lauriers Roses – 13600 La Ciotat, France<br />
              Email : <a href="mailto:jeanfrancois.darnet@info-peche.fr" className="text-primary hover:underline">jeanfrancois.darnet@info-peche.fr</a><br />
              Téléphone : <a href="tel:+33673694733" className="text-primary hover:underline">06 73 69 47 33</a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">Article 3 — Produits et tarifs</h2>
            <p>
              Les produits proposés à la vente sont : les numéros du magazine Info Pêche (format papier et/ou numérique PDF), les abonnements (annuels et semestriels, papier et/ou numérique).
            </p>
            <p className="mt-2">
              Les prix sont indiqués en euros toutes taxes comprises (TTC). La TVA applicable est celle en vigueur au jour de la commande (taux super-réduit de 2,1 % applicable aux publications de presse en France). Info Pêche se réserve le droit de modifier ses tarifs à tout moment ; les produits sont facturés sur la base des prix en vigueur au moment de la validation de la commande.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">Article 4 — Commande</h2>
            <p>
              Le processus de commande comprend les étapes suivantes : sélection des produits, vérification du panier, saisie des coordonnées de livraison, choix du mode de paiement, validation et paiement. Un e-mail de confirmation récapitulatif est envoyé à l'adresse indiquée par le client.
            </p>
            <p className="mt-2">
              Info Pêche se réserve le droit de refuser ou d'annuler toute commande pour motif légitime (informations erronées, incident de paiement, fraude suspectée).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">Article 5 — Paiement</h2>
            <p>
              Le paiement s'effectue par carte bancaire (Visa, Mastercard) via la plateforme sécurisée <strong className="text-foreground">Stripe</strong>. Le montant est débité au moment de la validation de la commande. Les transactions sont chiffrées et sécurisées conformément aux normes PCI-DSS. Info Pêche ne stocke aucune donnée bancaire.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">Article 6 — Livraison</h2>
            <p>
              <strong className="text-foreground">Magazines papier :</strong> les envois sont effectués par voie postale (La Poste – lettre ou Colissimo selon le poids). Les délais de livraison sont estimés entre 5 et 10 jours ouvrés pour la France métropolitaine, et entre 10 et 20 jours ouvrés pour l'étranger. Info Pêche ne saurait être tenu responsable des retards imputables au transporteur.
            </p>
            <p className="mt-2">
              <strong className="text-foreground">Magazines numériques :</strong> l'accès au PDF est disponible immédiatement après validation du paiement, dans l'espace « Mon Compte » du client.
            </p>
            <p className="mt-2">
              Les frais de port sont indiqués lors du processus de commande et varient selon la destination et le poids du colis.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">Article 7 — Abonnements</h2>
            <p>
              Les abonnements débutent à compter du prochain numéro à paraître après réception du paiement. Chaque abonnement précise le nombre de numéros inclus.
            </p>
            <h3 className="font-semibold text-foreground mt-4 mb-2">Reconduction et résiliation</h3>
            <p>
              Les abonnements avec paiement récurrent sont reconduits automatiquement à leur échéance. Conformément à l'article L.215-1 du Code de la consommation, le client est informé par e-mail au moins un mois avant la date de reconduction. Le client peut résilier son abonnement à tout moment depuis son espace personnel ou en contactant le service client. La résiliation prend effet à la fin de la période en cours ; aucun remboursement au prorata n'est dû.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">Article 8 — Droit de rétractation</h2>
            <p>
              Conformément à l'article L.221-28, 13° du Code de la consommation, le droit de rétractation <strong className="text-foreground">ne s'applique pas</strong> aux journaux, périodiques et magazines, à l'exception des contrats d'abonnement. Pour les abonnements, le client dispose d'un délai de 14 jours à compter de la souscription pour exercer son droit de rétractation, en adressant sa demande à <a href="mailto:jeanfrancois.darnet@info-peche.fr" className="text-primary hover:underline">jeanfrancois.darnet@info-peche.fr</a>.
            </p>
            <p className="mt-2">
              Les contenus numériques (PDF) téléchargés ne sont pas remboursables, conformément à l'article L.221-28, 14° du Code de la consommation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">Article 9 — Réclamations et service client</h2>
            <p>
              Pour toute réclamation (numéro non reçu, erreur de livraison, défaut d'impression), contactez-nous :<br />
              Email : <a href="mailto:jeanfrancois.darnet@info-peche.fr" className="text-primary hover:underline">jeanfrancois.darnet@info-peche.fr</a><br />
              Téléphone : <a href="tel:+33673694733" className="text-primary hover:underline">06 73 69 47 33</a>
            </p>
            <p className="mt-2">
              Nous nous engageons à traiter votre demande dans un délai de 48 heures ouvrées. En cas de numéro défectueux ou non reçu, un nouvel exemplaire sera expédié sans frais supplémentaires.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">Article 10 — Médiation</h2>
            <p>
              Conformément aux articles L.611-1 et suivants du Code de la consommation, en cas de litige non résolu, le client peut recourir gratuitement au service de médiation de la consommation. Le médiateur compétent sera communiqué sur simple demande.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">Article 11 — Données personnelles</h2>
            <p>
              Les données personnelles collectées dans le cadre des commandes sont traitées conformément à notre politique de confidentialité détaillée dans les <a href="/mentions-legales" className="text-primary hover:underline">Mentions Légales</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">Article 12 — Droit applicable et juridiction compétente</h2>
            <p>
              Les présentes CGV sont soumises au droit français. En cas de litige, et après échec de toute tentative de résolution amiable, les tribunaux compétents du ressort de la Cour d'appel d'Aix-en-Provence seront seuls compétents.
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

export default CGV;
