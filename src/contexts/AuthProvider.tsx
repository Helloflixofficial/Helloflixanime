import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getAuthErrorMessage, supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Keys that are safe to clear on logout (app preferences)
const APP_STORAGE_KEYS = [
  "default_avatar",
  "custom_home_bg",
  "custom_icon_pack",
  "custom_sidebar_bg",
  "custom_right_sidebar_bg",
  "uiPreferences",
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const safetyTimeout = window.setTimeout(() => {
      if (mounted) setLoading(false);
    }, 10000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    const resolveSession = async () => {
      try {
        // Supabase handles implicit and PKCE callback URLs during client
        // initialization because detectSessionInUrl is enabled in the client.
        // getSession waits for that initialization before returning.
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!mounted) return;

        setSession(data.session);
        setUser(data.session?.user ?? null);
      } catch (error) {
        if (mounted) {
          console.error('Auth session initialization failed:', getAuthErrorMessage(error));
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          clearTimeout(safetyTimeout);
          setLoading(false);
        }
      }
    };

    void resolveSession();

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    try {
      // Sign out from Supabase first — this properly cleans up the sb-* auth token
      await supabase.auth.signOut({ scope: "global" });
    } catch (err) {
      console.error("AuthProvider: signOut error:", err);
    }

    // Only clear app-specific keys after signOut has cleaned up auth tokens
    APP_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    sessionStorage.clear();

    // Force full page reload to clear all in-memory state
    window.location.href = "/auth";
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
