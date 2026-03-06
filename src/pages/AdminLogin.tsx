import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Lock, Loader2, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Impossible de récupérer l'utilisateur");

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");

      if (!roles || roles.length === 0) {
        await supabase.auth.signOut();
        throw new Error("Accès refusé. Vous n'avez pas les droits administrateur.");
      }

      navigate("/admin");
    } catch (err: any) {
      toast({
        title: "Erreur de connexion",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: "Entrez votre email", variant: "destructive" });
      return;
    }
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Administration</h1>
          <p className="text-sm text-muted-foreground mt-1">Info Pêche — Espace réservé</p>
        </div>

        {forgotMode ? (
          <div className="bg-white rounded-xl border border-border p-6 space-y-4 shadow-sm">
            {resetSent ? (
              <div className="text-center py-4 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                <h2 className="font-semibold text-lg">Email envoyé !</h2>
                <p className="text-sm text-muted-foreground">
                  Si un compte admin existe pour <strong>{email}</strong>, un lien de réinitialisation a été envoyé. Vérifiez votre boîte mail (et vos spams).
                </p>
                <Button variant="outline" className="w-full mt-4" onClick={() => { setForgotMode(false); setResetSent(false); }}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Retour à la connexion
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="text-center mb-2">
                  <Mail className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h2 className="font-semibold text-lg">Mot de passe oublié</h2>
                  <p className="text-sm text-muted-foreground">Entrez votre email admin pour recevoir un lien de réinitialisation.</p>
                </div>
                <div>
                  <Label htmlFor="reset-email">Email</Label>
                  <Input id="reset-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" />
                </div>
                <Button type="submit" disabled={resetLoading} className="w-full bg-primary hover:bg-primary/90 text-white">
                  {resetLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Envoyer le lien
                </Button>
                <Button type="button" variant="ghost" className="w-full text-sm" onClick={() => setForgotMode(false)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Retour à la connexion
                </Button>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={handleLogin} className="bg-white rounded-xl border border-border p-6 space-y-4 shadow-sm">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Se connecter
            </Button>
            <div className="text-center">
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => setForgotMode(true)}
              >
                Mot de passe oublié ?
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
