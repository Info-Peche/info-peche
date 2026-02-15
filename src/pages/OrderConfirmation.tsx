import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const OrderConfirmation = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-lg text-center">
          <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-6" />
          <h1 className="text-3xl font-serif font-bold mb-4 text-foreground">
            Merci pour votre commande !
          </h1>
          <p className="text-muted-foreground mb-8">
            Votre paiement a été confirmé. Vous recevrez un email de confirmation sous quelques minutes.
          </p>
          <Button onClick={() => navigate("/")} className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8 py-4">
            Retour à l'accueil
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderConfirmation;
