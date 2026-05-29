import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
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
    
    // Determine if we're currently processing an OAuth or Magic Link redirect
    // If so, we want to stay in loading state longer to let the listener catch it
    const isAuthCallback = 
      window.location.hash.includes("access_token=") ||
      window.location.search.includes("code=");

    // Safety timeout: if auth never resolves, stop loading
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("AuthProvider: Session resolution timed out after 8s");
        setLoading(false);
      }
    }, 8000);

    // 1. Get the current session first
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!mounted) return;
      console.log("AuthProvider: getSession →", currentSession ? "session exists" : "no session");
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      // If we are in an auth callback, don't clear loading here.
      // Wait for onAuthStateChange to fire SIGNED_IN.
      if (!isAuthCallback) {
        setLoading(false);
      }
      clearTimeout(safetyTimeout);
    });

    // 2. Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      console.log("AuthProvider: onAuthStateChange →", _event, newSession ? "session exists" : "no session");
      setSession(newSession);
      setUser(newSession?.user ?? null);
      // Only clear loading if it's still true (getSession may have already done it)
      setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
