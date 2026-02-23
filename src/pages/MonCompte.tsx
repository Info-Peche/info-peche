import { useState } from "react";
import { motion } from "framer-motion";
import { LogIn, UserPlus, Mail, Lock, Loader2, ArrowLeft, LogOut, Crown, BookOpen, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SideCart from "@/components/SideCart";

type Mode = "login" | "signup" | "forgot";

const MonCompte = () => {
  const { user, signIn, signUp, signOut, resetPassword, subscriptionTier, subscriptionEnd, hasAccessToBlog, hasAccessToMagazines, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (mode === "forgot") {
        const { error } = await resetPassword(email);
        if (error) throw error;
        toast.success("Un email de réinitialisation vous a été envoyé.");
        setMode("login");
      } else if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success("Connexion réussie !");
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
        toast.success("Inscription réussie ! Vérifiez votre email pour confirmer votre compte.");
      }
    } catch (err: any) {
      toast.error(err.message || "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  const tierLabels: Record<string, string> = {
    "6mois": "Abonnement 6 mois",
    "1an": "Abonnement 1 an",
    "2ans": "Abonnement 2 ans",
    none: "Aucun abonnement actif",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-28 pb-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  // Logged-in dashboard
  if (user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <SideCart />
        <main className="pt-28 pb-20">
          <div className="container mx-auto px-4 max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-8 shadow-sm">
              <h1 className="text-3xl font-serif font-bold mb-2 text-foreground">Mon compte</h1>
              <p className="text-muted-foreground mb-8">{user.email}</p>

              <div className="space-y-4 mb-8">
                <div className="bg-muted rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Crown className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-foreground">{tierLabels[subscriptionTier]}</h3>
                  </div>
                  {subscriptionEnd && (
                    <p className="text-sm text-muted-foreground">
                      Valable jusqu'au {new Date(subscriptionEnd).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={`rounded-xl p-4 border ${hasAccessToBlog ? "border-primary/30 bg-primary/5" : "border-border bg-muted/50"}`}>
                    <BookOpen className={`w-5 h-5 mb-2 ${hasAccessToBlog ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="text-sm font-medium">Articles blog</p>
                    <p className="text-xs text-muted-foreground">{hasAccessToBlog ? "Accès complet" : "Non inclus"}</p>
                  </div>
                  <div className={`rounded-xl p-4 border ${hasAccessToMagazines ? "border-primary/30 bg-primary/5" : "border-border bg-muted/50"}`}>
                    <Eye className={`w-5 h-5 mb-2 ${hasAccessToMagazines ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="text-sm font-medium">Magazines en ligne</p>
                    <p className="text-xs text-muted-foreground">{hasAccessToMagazines ? "Accès complet" : "Non inclus"}</p>
                  </div>
                </div>
              </div>

              {subscriptionTier === "none" && (
                <Button onClick={() => navigate("/#subscribe")} className="w-full mb-4 bg-primary text-white rounded-xl py-5 font-bold">
                  Découvrir nos offres d'abonnement
                </Button>
              )}

              <Button variant="outline" onClick={signOut} className="w-full rounded-xl">
                <LogOut className="w-4 h-4 mr-2" /> Se déconnecter
              </Button>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Login / Signup / Forgot password forms
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SideCart />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-md">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-8 shadow-sm">
            <h1 className="text-2xl font-serif font-bold mb-1 text-foreground">
              {mode === "login" ? "Se connecter" : mode === "signup" ? "Créer un compte" : "Mot de passe oublié"}
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              {mode === "login"
                ? "Accédez à votre espace abonné"
                : mode === "signup"
                ? "Créez votre compte pour vous abonner"
                : "Entrez votre email pour réinitialiser"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" placeholder="votre@email.com" />
                </div>
              </div>

              {mode !== "forgot" && (
                <div>
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" placeholder="••••••••" />
                  </div>
                </div>
              )}

              <Button type="submit" disabled={submitting} className="w-full py-5 rounded-xl bg-primary text-white font-bold">
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : mode === "login" ? (
                  <LogIn className="w-4 h-4 mr-2" />
                ) : mode === "signup" ? (
                  <UserPlus className="w-4 h-4 mr-2" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                {mode === "login" ? "Se connecter" : mode === "signup" ? "Créer mon compte" : "Envoyer le lien"}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              {mode === "login" && (
                <>
                  <button onClick={() => setMode("forgot")} className="text-sm text-primary hover:underline block mx-auto">
                    Mot de passe oublié ?
                  </button>
                  <p className="text-sm text-muted-foreground">
                    Pas encore de compte ?{" "}
                    <button onClick={() => setMode("signup")} className="text-primary font-medium hover:underline">
                      S'inscrire
                    </button>
                  </p>
                </>
              )}
              {mode === "signup" && (
                <p className="text-sm text-muted-foreground">
                  Déjà un compte ?{" "}
                  <button onClick={() => setMode("login")} className="text-primary font-medium hover:underline">
                    Se connecter
                  </button>
                </p>
              )}
              {mode === "forgot" && (
                <button onClick={() => setMode("login")} className="text-sm text-primary hover:underline">
                  Retour à la connexion
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MonCompte;
