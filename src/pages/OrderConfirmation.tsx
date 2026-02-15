import { useEffect, useState } from "react";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type OrderDetails = {
  success: boolean;
  status: string;
  customer_name?: string;
  customer_email?: string;
  total?: string;
  order_type?: string;
  line_items?: { name: string; quantity: number; amount: string }[];
  message?: string;
};

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const verifyPayment = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("verify-payment", {
          body: { session_id: sessionId },
        });
        if (fnError) throw fnError;
        setOrder(data);
      } catch (err: any) {
        setError(err.message || "Impossible de vérifier le paiement.");
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-lg text-center">
          {loading ? (
            <div className="py-20">
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Vérification de votre paiement...</p>
            </div>
          ) : error ? (
            <>
              <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
              <h1 className="text-2xl font-bold mb-4 text-foreground">Erreur</h1>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => navigate("/")} variant="outline">
                Retour à l'accueil
              </Button>
            </>
          ) : order?.success ? (
            <>
              <CheckCircle className="w-20 h-20 mx-auto text-primary mb-6" />
              <h1 className="text-3xl font-serif font-bold mb-4 text-foreground">
                Merci {order.customer_name} !
              </h1>
              <p className="text-muted-foreground mb-8">
                Votre paiement de <span className="font-bold text-primary">{order.total}</span> a été confirmé.
                Un email de confirmation a été envoyé à <span className="font-medium">{order.customer_email}</span>.
              </p>

              {order.line_items && order.line_items.length > 0 && (
                <div className="bg-white rounded-xl border border-border p-6 text-left mb-8">
                  <h2 className="font-bold text-foreground mb-4">Récapitulatif</h2>
                  <div className="space-y-2">
                    {order.line_items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-foreground/80">
                          {item.name} {item.quantity > 1 && `×${item.quantity}`}
                        </span>
                        <span className="font-medium">{item.amount}€</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border mt-4 pt-3 flex justify-between">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-primary">{order.total}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={() => navigate("/")}
                className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8 py-4"
              >
                Retour à l'accueil
              </Button>
            </>
          ) : (
            <>
              <AlertCircle className="w-16 h-16 mx-auto text-accent mb-4" />
              <h1 className="text-2xl font-bold mb-4 text-foreground">Paiement en attente</h1>
              <p className="text-muted-foreground mb-6">
                {order?.message || "Votre paiement n'a pas encore été confirmé. Veuillez patienter quelques instants."}
              </p>
              <Button onClick={() => window.location.reload()} variant="outline" className="mr-3">
                Rafraîchir
              </Button>
              <Button onClick={() => navigate("/")} variant="ghost">
                Retour à l'accueil
              </Button>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderConfirmation;
