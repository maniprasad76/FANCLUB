import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '../lib/api';
import { supabase } from '../lib/supabase';

interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AdminAuthContextType {
  admin: Admin | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  socialLogin: (provider: 'google' | 'facebook') => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  const forceLogout = useCallback(() => {
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_refresh_token');
    setAdmin(null);
  }, []);

  useEffect(() => {
    // Restore session from localStorage and verify
    const stored = localStorage.getItem('admin_user');
    if (stored) {
      try {
        setAdmin(JSON.parse(stored));
      } catch {
        localStorage.removeItem('admin_user');
      }

      // Verify the JWT cookie is still valid
      api.get('/auth/profile').then(res => {
        if (res.data?.role !== 'ADMIN') {
          forceLogout();
        } else {
          setAdmin(res.data);
          localStorage.setItem('admin_user', JSON.stringify(res.data));
        }
      }).catch(() => {
        forceLogout();
      }).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    // Listen for session-expired events
    const handleExpired = () => {
      forceLogout();
    };
    window.addEventListener('auth:session-expired', handleExpired);

    // Handle OAuth redirect
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        try {
          const res = await api.post('/auth/admin/oauth/sync', { access_token: session.access_token });
          setAdmin(res.data.user);
          localStorage.setItem('admin_user', JSON.stringify(res.data.user));
          if (session.refresh_token) {
            localStorage.setItem('admin_refresh_token', session.refresh_token);
          }
        } catch {
          await supabase.auth.signOut();
        }
      }
    });

    return () => {
      data.subscription.unsubscribe();
      window.removeEventListener('auth:session-expired', handleExpired);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/admin/signin', { email, password });
    localStorage.setItem('admin_user', JSON.stringify(data.user));
    if (data.session?.refresh_token) {
      localStorage.setItem('admin_refresh_token', data.session.refresh_token);
    }
    setAdmin(data.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Server unreachable — still clear local
    }
    forceLogout();
  };

  const socialLogin = async (provider: 'google' | 'facebook') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout, socialLogin }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be inside AdminAuthProvider');
  return ctx;
}
