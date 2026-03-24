import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const verifyToken = async () => {
      // Method 1: token_hash in query params (new direct link approach)
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      if (tokenHash && type === "recovery") {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });
          if (error) {
            console.error("verifyOtp error:", error.message);
            setErrorMsg("Le lien est invalide ou expiré. Veuillez refaire une demande.");
            setVerifying(false);
            return;
          }
          setVerified(true);
          setVerifying(false);
        } catch (err) {
          console.error("verifyOtp exception:", err);
          setErrorMsg("Erreur lors de la vérification du lien.");
          setVerifying(false);
        }
        return;
      }

      // Method 2: hash fragment (legacy Supabase redirect approach)
      const hash = window.location.hash;
      if (hash.includes("type=recovery") || hash.includes("access_token")) {
        // Supabase client auto-handles the hash on load
        // Wait a moment for session to be established
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setVerified(true);
          setVerifying(false);
          return;
        }
        // Listen for auth state change
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
          if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
            setVerified(true);
            setVerifying(false);
            subscription.unsubscribe();
          }
        });
        // Timeout after 5s
        setTimeout(() => {
          setVerifying(false);
          if (!verified) {
            setErrorMsg("Le lien est invalide ou expiré. Veuillez refaire une demande.");
          }
          subscription.unsubscribe();
        }, 5000);
        return;
      }

      // No token found
      setVerifying(false);
      setErrorMsg("Aucun lien de réinitialisation détecté.");
    };

    verifyToken();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      toast.success("Mot de passe mis à jour !");
      setTimeout(() => navigate("/mon-compte"), 2000);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la mise à jour.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-md">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-8 shadow-sm">
            {verifying ? (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Vérification du lien en cours...</p>
              </div>
            ) : errorMsg ? (
              <div className="text-center py-8">
                <p className="text-destructive font-medium mb-4">{errorMsg}</p>
                <Button onClick={() => navigate("/mon-compte")} variant="outline" className="rounded-xl">
                  Retour à la connexion
                </Button>
              </div>
            ) : done ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Mot de passe modifié</h2>
                <p className="text-muted-foreground">Redirection en cours...</p>
              </div>
            ) : verified ? (
              <>
                <h1 className="text-2xl font-serif font-bold mb-6">Nouveau mot de passe</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="password">Nouveau mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" />
                    </div>
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full py-5 rounded-xl bg-primary text-white font-bold">
                    {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Mettre à jour
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-destructive font-medium mb-4">Lien invalide ou expiré.</p>
                <Button onClick={() => navigate("/mon-compte")} variant="outline" className="rounded-xl">
                  Retour à la connexion
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ResetPassword;
