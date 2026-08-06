import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { toast } from 'react-hot-toast';
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
  idleWarning: boolean;
  remainingIdleTime: number; // seconds remaining until auto-logout
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

/* ─── HIGH 10: Admin session idle timeout ─── */
const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const WARNING_AT = 5 * 60 * 1000; // warn 5 minutes before expiry

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [idleWarning, setIdleWarning] = useState(false);
  const [remainingIdleTime, setRemainingIdleTime] = useState(IDLE_TIMEOUT / 1000);

  const lastActivityRef = useRef<number>(Date.now());
  const adminRef = useRef<Admin | null>(null);
  adminRef.current = admin;

  const forceLogout = useCallback(() => {
    sessionStorage.removeItem('admin_user');
    sessionStorage.removeItem('admin_refresh_token');
    sessionStorage.removeItem('admin_access_token');
    setAdmin(null);
    setIdleWarning(false);
  }, []);

  // Track any user activity to keep the admin session alive
  useEffect(() => {
    const handler = () => { lastActivityRef.current = Date.now(); };
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, handler));
  }, []);

  // Idle watchdog — checks every second, logs out after 15 min of inactivity
  useEffect(() => {
    if (!adminRef.current) { setIdleWarning(false); return; }

    const interval = setInterval(() => {
      const remaining = lastActivityRef.current + IDLE_TIMEOUT - Date.now();
      if (remaining <= 0) {
        toast.error('Session timed out due to inactivity.');
        forceLogout();
        return;
      }
      const seconds = Math.ceil(remaining / 1000);
      if (remaining <= WARNING_AT) {
        setIdleWarning(true);
        setRemainingIdleTime(seconds);
      } else {
        setIdleWarning(false);
        setRemainingIdleTime(seconds);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [forceLogout, admin]);

  useEffect(() => {
    // Restore session from sessionStorage and verify
    const stored = sessionStorage.getItem('admin_user');
    if (stored) {
      try {
        setAdmin(JSON.parse(stored));
      } catch {
        sessionStorage.removeItem('admin_user');
      }

      // Verify the JWT cookie is still valid
      api.get('/auth/profile').then(res => {
        if (res.data?.role !== 'ADMIN') {
          forceLogout();
        } else {
          setAdmin(res.data);
          sessionStorage.setItem('admin_user', JSON.stringify(res.data));
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
          sessionStorage.setItem('admin_user', JSON.stringify(res.data.user));
          if (res.data.session?.access_token) {
            sessionStorage.setItem('admin_access_token', res.data.session.access_token);
          }
          if (session.refresh_token) {
            sessionStorage.setItem('admin_refresh_token', session.refresh_token);
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
  }, [forceLogout]);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/admin/signin', { email, password });
    sessionStorage.setItem('admin_user', JSON.stringify(data.user));
    if (data.session?.access_token) {
      sessionStorage.setItem('admin_access_token', data.session.access_token);
    }
    if (data.session?.refresh_token) {
      sessionStorage.setItem('admin_refresh_token', data.session.refresh_token);
    }
    lastActivityRef.current = Date.now();
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
    <AdminAuthContext.Provider value={{ admin, loading, login, logout, socialLogin, idleWarning, remainingIdleTime }}>
      {children}
      {idleWarning && admin && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999,
          background: '#F0C020',
          color: '#1a1a2e',
          border: '3px solid #1a1a2e',
          boxShadow: '4px 4px 0 0 #1a1a2e',
          padding: '12px 20px',
          fontFamily: 'monospace',
          fontWeight: 800,
          fontSize: '0.8rem',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          maxWidth: '90vw',
          textAlign: 'center',
        }}>
          Session expires in {Math.floor(remainingIdleTime / 60)}m {remainingIdleTime % 60}s — move mouse or press a key to stay logged in.
        </div>
      )}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be inside AdminAuthProvider');
  return ctx;
}
