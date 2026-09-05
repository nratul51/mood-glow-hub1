import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let sawAuthEvent = false;

    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (!mounted) return;
      // Ignore the transient null that can arrive mid token-refresh; only a real
      // sign-out should clear the session (otherwise the app blanks out).
      if (!next && event !== "SIGNED_OUT") return;
      sawAuthEvent = true;
      setSession(next);
      setLoading(false);
    });

    supabase.auth
      .getSession()
      .then(({ data: { session: current } }) => {
        if (!mounted) return;
        // Don't let a late-resolving getSession() overwrite fresher listener state.
        if (!sawAuthEvent) setSession(current);
        setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);


  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
