import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      // No recovery token, redirect
      navigate("/mon-compte");
    }
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
            {done ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Mot de passe modifié</h2>
                <p className="text-muted-foreground">Redirection en cours...</p>
              </div>
            ) : (
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
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ResetPassword;
