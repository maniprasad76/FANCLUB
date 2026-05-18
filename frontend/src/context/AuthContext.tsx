import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '../lib/api';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
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
  socialLogin: (provider: 'google' | 'facebook') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Force logout — called when session cannot be refreshed.
   */
  const forceLogout = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('refresh_token');
    setUser(null);
  }, []);

  useEffect(() => {
    let authListener: any = null;
    let oauthHandled = false;

    // ── Detect if this is an OAuth callback redirect ──
    // Supabase appends auth tokens as URL hash fragments after OAuth redirect
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const isOAuthCallback = hashParams.has('access_token') || hashParams.has('refresh_token');

    // ── 1. Try to restore session from localStorage ──
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
      }
      // Verify the session cookie is still valid (this will trigger auto-refresh via api interceptor if needed)
      api.get('/auth/profile').then(res => {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      }).catch(() => {
        // Token refresh also failed — clear everything
        forceLogout();
      }).finally(() => {
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
      toast.error('Session expired. Please sign in again.');
    };
    window.addEventListener('auth:session-expired', handleSessionExpired);

    // ── 3. Capture Supabase OAuth Redirect ──
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        oauthHandled = true;
        try {
          const res = await api.post('/auth/user/oauth/sync', { access_token: session.access_token });
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          if (session.refresh_token) {
            localStorage.setItem('refresh_token', session.refresh_token);
          }
          // Clean up the hash fragments from the URL
          if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        } catch (err) {
          console.error('Failed to sync OAuth session:', err);
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
          console.warn('OAuth callback timed out — clearing loading state');
          setLoading(false);
        }
      }, 10000);
    }

    return () => {
      if (authListener) authListener.unsubscribe();
      if (oauthTimeout) clearTimeout(oauthTimeout);
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/signin', { email, password });
    // Store user data
    localStorage.setItem('user', JSON.stringify(data.user));
    // Store refresh_token for automatic token refresh
    if (data.session?.refresh_token) {
      localStorage.setItem('refresh_token', data.session.refresh_token);
    }
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const { data } = await api.post('/auth/signup', { email, password, name });
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.session?.refresh_token) {
        localStorage.setItem('refresh_token', data.session.refresh_token);
      }
      setUser(data.user);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Server may be unreachable — still clear local state
    }
    localStorage.removeItem('user');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
    }
  };

  const socialLogin = async (provider: 'google' | 'facebook') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin
      }
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, socialLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
