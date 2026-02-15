import Header from "@/components/Header";
import Footer from "@/components/Footer";

const CGV = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="pt-28 pb-20">
      <div className="container mx-auto px-4 max-w-3xl prose prose-slate">
        <h1 className="text-3xl font-serif font-bold text-foreground">Conditions Générales de Vente</h1>

        <h2>Article 1 — Objet</h2>
        <p>
          Les présentes conditions générales de vente régissent les ventes de magazines et abonnements 
          proposés par Info Pêche Magazine sur le site info-peche.fr.
        </p>

        <h2>Article 2 — Prix</h2>
        <p>
          Les prix sont indiqués en euros TTC. Info Pêche se réserve le droit de modifier ses prix à tout moment. 
          Les produits sont facturés sur la base des tarifs en vigueur au moment de la validation de la commande.
        </p>

        <h2>Article 3 — Commande</h2>
        <p>
          Toute commande implique l'acceptation des présentes CGV. La commande est considérée comme définitive 
          après validation du paiement. Un email de confirmation est envoyé au client.
        </p>

        <h2>Article 4 — Paiement</h2>
        <p>
          Le paiement s'effectue par carte bancaire, PayPal ou prélèvement SEPA via la plateforme sécurisée Stripe. 
          Le paiement est débité au moment de la validation de la commande.
        </p>

        <h2>Article 5 — Livraison</h2>
        <p>
          Les magazines sont envoyés par voie postale à l'adresse indiquée lors de la commande. 
          Les délais de livraison sont estimés entre 5 et 10 jours ouvrés pour la France métropolitaine. 
          Info Pêche ne saurait être tenu responsable des retards imputables au transporteur.
        </p>

        <h2>Article 6 — Abonnements et tacite reconduction</h2>
        <p>
          Les abonnements sont reconduits automatiquement à leur échéance. Le client peut résilier son 
          abonnement à tout moment via son espace de gestion Stripe ou en contactant le service client. 
          La résiliation prend effet à la fin de la période en cours.
        </p>

        <h2>Article 7 — Droit de rétractation</h2>
        <p>
          Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne peut 
          être exercé pour les journaux, périodiques ou magazines. Toutefois, pour tout problème lié à 
          votre commande, contactez-nous à jeanfrancois.darnet@gmail.com.
        </p>

        <h2>Article 8 — Réclamations</h2>
        <p>
          Pour toute réclamation, contactez-nous par email à jeanfrancois.darnet@gmail.com. 
          Nous nous engageons à traiter votre demande dans un délai de 48 heures ouvrées.
        </p>

        <h2>Article 9 — Droit applicable</h2>
        <p>
          Les présentes CGV sont soumises au droit français. En cas de litige, les tribunaux 
          français seront seuls compétents.
        </p>
      </div>
    </main>
    <Footer />
  </div>
);

export default CGV;
