import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type SubscriptionTier = "none" | "6mois" | "1an" | "2ans";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscriptionTier: SubscriptionTier;
  subscriptionEnd: string | null;
  checkingSubscription: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  hasAccessToBlog: boolean;
  hasAccessToMagazines: boolean;
  refreshSubscription: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Map Stripe product IDs to tiers
const PRODUCT_TIER_MAP: Record<string, SubscriptionTier> = {
  prod_Tyzgq3QeYl52IS: "2ans",
  prod_Tyzho0muIqVKsX: "1an",
  prod_Tyzh45p7SqdgGh: "6mois",
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("none");
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(false);

  const checkSubscription = async () => {
    if (!session) {
      setSubscriptionTier("none");
      setSubscriptionEnd(null);
      return;
    }
    setCheckingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.subscribed && data?.product_id) {
        const tier = PRODUCT_TIER_MAP[data.product_id] || "none";
        setSubscriptionTier(tier);
        setSubscriptionEnd(data.subscription_end || null);
      } else {
        setSubscriptionTier("none");
        setSubscriptionEnd(null);
      }
    } catch {
      setSubscriptionTier("none");
      setSubscriptionEnd(null);
    } finally {
      setCheckingSubscription(false);
    }
  };

  useEffect(() => {
    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Then get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check subscription when session changes
  useEffect(() => {
    if (session) {
      checkSubscription();
    } else {
      setSubscriptionTier("none");
      setSubscriptionEnd(null);
    }
  }, [session?.access_token]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSubscriptionTier("none");
    setSubscriptionEnd(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const hasAccessToBlog = subscriptionTier === "1an" || subscriptionTier === "2ans";
  const hasAccessToMagazines = subscriptionTier === "2ans";

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        subscriptionTier,
        subscriptionEnd,
        checkingSubscription,
        signIn,
        signUp,
        signOut,
        resetPassword,
        hasAccessToBlog,
        hasAccessToMagazines,
        refreshSubscription: checkSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
