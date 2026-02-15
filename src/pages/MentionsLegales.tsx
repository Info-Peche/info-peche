import Header from "@/components/Header";
import Footer from "@/components/Footer";

const MentionsLegales = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="pt-28 pb-20">
      <div className="container mx-auto px-4 max-w-3xl prose prose-slate">
        <h1 className="text-3xl font-serif font-bold text-foreground">Mentions Légales</h1>

        <h2>Éditeur du site</h2>
        <p>
          <strong>Info Pêche Magazine</strong><br />
          Responsable de la publication : Jean-François Darnet<br />
          Email : jeanfrancois.darnet@gmail.com
        </p>

        <h2>Hébergement</h2>
        <p>
          Ce site est hébergé par Lovable (lovable.dev).<br />
          Les données sont stockées sur des serveurs sécurisés en Europe.
        </p>

        <h2>Propriété intellectuelle</h2>
        <p>
          L'ensemble des contenus présents sur ce site (textes, images, logos, graphismes) est protégé 
          par le droit d'auteur. Toute reproduction, même partielle, est interdite sans autorisation écrite préalable.
        </p>

        <h2>Données personnelles</h2>
        <p>
          Les données personnelles collectées (nom, email, adresse) sont utilisées uniquement pour le 
          traitement des commandes et l'envoi des magazines. Conformément au RGPD, vous disposez d'un 
          droit d'accès, de rectification et de suppression de vos données en contactant : 
          jeanfrancois.darnet@gmail.com
        </p>

        <h2>Cookies</h2>
        <p>
          Ce site utilise des cookies techniques nécessaires à son bon fonctionnement. 
          Aucun cookie publicitaire ou de suivi n'est utilisé.
        </p>
      </div>
    </main>
    <Footer />
  </div>
);

export default MentionsLegales;
