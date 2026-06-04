import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface AdminLoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onLogin(email, password);
      toast.success('Successfully logged in');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '20px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'var(--bg-card)',
          border: '3px solid var(--bauhaus-black)',
          boxShadow: '8px 8px 0px 0px var(--bauhaus-black)',
          padding: '40px 32px',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{
              background: 'var(--bauhaus-black)',
              color: 'var(--bauhaus-white)',
              fontWeight: 900,
              fontSize: '1.5rem',
              padding: '6px 12px',
              letterSpacing: '2px',
              fontFamily: 'var(--font-heading)',
            }}>FAN</span>
            <span style={{
              fontWeight: 900,
              fontSize: '1.5rem',
              letterSpacing: '4px',
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-primary)',
            }}>ADMIN</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px' }}>
            Control Panel
          </p>
        </div>

        {/* Bauhaus divider */}
        <div style={{ display: 'flex', gap: 0, height: '3px', marginBottom: '28px' }}>
          <div style={{ flex: 1, background: 'var(--bauhaus-red)' }} />
          <div style={{ flex: 1, background: 'var(--bauhaus-blue)' }} />
          <div style={{ flex: 1, background: 'var(--bauhaus-yellow)' }} />
        </div>



        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              color: 'var(--text-primary)',
            }}>Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@fanclub.com"
              required
              id="admin-login-email"
            />
          </div>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              color: 'var(--text-primary)',
            }}>Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              id="admin-login-password"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '8px' }}
            id="admin-login-submit"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
