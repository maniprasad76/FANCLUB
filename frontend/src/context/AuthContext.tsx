import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  ReactNode,
} from "react";
import api from "../lib/api";
import { supabase } from "../lib/supabase";
import { toast } from "react-hot-toast";

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  socialLogin: (provider: "google" | "facebook") => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Force logout — called when session cannot be refreshed.
   */
  const forceLogout = useCallback(() => {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("access_token");
    setUser(null);
  }, []);

  useEffect(() => {
    let authListener: any = null;
    let oauthHandled = false;

    // ── Detect if this is an OAuth callback redirect ──
    // Supabase appends auth tokens as URL hash fragments after OAuth redirect
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);
    const isOAuthCallback =
      hashParams.has("access_token") || hashParams.has("refresh_token");

    // Supabase sends errors in EITHER hash OR query string depending on the error type
    const oauthError =
      hashParams.get("error_description") ||
      hashParams.get("error") ||
      queryParams.get("error_description") ||
      queryParams.get("error");

    if (oauthError) {
      const readable = decodeURIComponent(oauthError).replace(/\+/g, " ");
      toast.error("Sign-in failed: " + readable);
      // Clean up the URL so the error doesn't persist on reload
      window.history.replaceState(null, "", window.location.pathname);
    }


    // ── 1. Try to restore session from sessionStorage ──
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        sessionStorage.removeItem("user");
      }
      // Verify the session cookie is still valid (this will trigger auto-refresh via api interceptor if needed)
      api
        .get("/auth/profile")
        .then((res) => {
          setUser(res.data);
          sessionStorage.setItem("user", JSON.stringify(res.data));
        })
        .catch(() => {
          // Token refresh also failed — clear everything
          forceLogout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (!isOAuthCallback) {
      // Only set loading=false immediately if there's NO OAuth callback pending.
      // If this IS an OAuth callback, keep loading=true until onAuthStateChange fires.
      setLoading(false);
    }

    // ── 2. Listen for session-expired events from the API interceptor ──
    const handleSessionExpired = () => {
      forceLogout();
      toast.error("Session expired. Please sign in again.");
    };
    window.addEventListener("auth:session-expired", handleSessionExpired);

    // ── 3. Capture Supabase OAuth Redirect ──
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        oauthHandled = true;
        try {
          const res = await api.post("/auth/user/oauth/sync", {
            access_token: session.access_token,
          });
          setUser(res.data.user);
          sessionStorage.setItem("user", JSON.stringify(res.data.user));
          if (res.data.session?.access_token) {
            sessionStorage.setItem("access_token", res.data.session.access_token);
          }
          if (session.refresh_token) {
            sessionStorage.setItem("refresh_token", session.refresh_token);
          }
          // Clean up the hash fragments from the URL
          if (window.location.hash) {
            window.history.replaceState(
              null,
              "",
              window.location.pathname + window.location.search,
            );
          }
        } catch (err: any) {
          console.error("Failed to sync OAuth session:", err);
          toast.error("Login Error: " + (err.response?.data?.message || err.message || "Unknown backend error"));
          await supabase.auth.signOut();
        } finally {
          setLoading(false);
        }
      } else if (isOAuthCallback && !oauthHandled) {
        // OAuth callback present but no session — sign-in failed or was cancelled
        setLoading(false);
      }
    });
    authListener = data.subscription;

    // ── 4. Safety timeout: if OAuth callback doesn't resolve in 10s, stop loading ──
    let oauthTimeout: ReturnType<typeof setTimeout> | null = null;
    if (isOAuthCallback) {
      oauthTimeout = setTimeout(() => {
        if (!oauthHandled) {
          console.warn("OAuth callback timed out — clearing loading state");
          setLoading(false);
        }
      }, 10000);
    }

    return () => {
      if (authListener) authListener.unsubscribe();
      if (oauthTimeout) clearTimeout(oauthTimeout);
      window.removeEventListener("auth:session-expired", handleSessionExpired);
    };
  }, [forceLogout]);

  const login = async (email: string, password: string) => {
    const { data } = await api.post("/auth/signin", { email, password });
    // Store user data
    sessionStorage.setItem("user", JSON.stringify(data.user));
    // Store tokens for automatic token refresh
    if (data.session?.access_token) {
      sessionStorage.setItem("access_token", data.session.access_token);
    }
    if (data.session?.refresh_token) {
      sessionStorage.setItem("refresh_token", data.session.refresh_token);
    }
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const { data } = await api.post("/auth/signup", { email, password, name });
    if (data.user) {
      sessionStorage.setItem("user", JSON.stringify(data.user));
      if (data.session?.access_token) {
        sessionStorage.setItem("access_token", data.session.access_token);
      }
      if (data.session?.refresh_token) {
        sessionStorage.setItem("refresh_token", data.session.refresh_token);
      }
      setUser(data.user);
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Server may be unreachable — still clear local state
    }
    // Also sign out of Supabase to fully invalidate the session
    try {
      await supabase.auth.signOut();
    } catch {
      // Supabase may be unreachable — still clear local state
    }
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("access_token");
    setUser(null);
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
      sessionStorage.setItem("user", JSON.stringify(updated));
    }
  };

  const socialLogin = async (provider: "google" | "facebook") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  };

  // ── Session inactivity timer (30 min) ──
  // Auto-logout after 30 minutes of no user interaction to prevent
  // stale sessions on shared/public computers.
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (user) {
      inactivityTimerRef.current = setTimeout(() => {
        toast.error("Session timed out due to inactivity.");
        logout();
      }, INACTIVITY_TIMEOUT);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    // Throttle: only reset timer at most once per 5 seconds to avoid excessive calls during scroll
    let lastReset = 0;
    const handler = () => {
      const now = Date.now();
      if (now - lastReset > 5000) {
        lastReset = now;
        resetInactivityTimer();
      }
    };

    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    resetInactivityTimer(); // Start the timer

    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [user, resetInactivityTimer]);

  /* ─── Memoize context value to prevent unnecessary consumer re-renders ─── */
  const contextValue = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    socialLogin,
  }), [user, loading, login, register, logout, updateUser, socialLogin]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
