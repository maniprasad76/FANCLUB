import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Lock, Mail, ArrowRight } from 'lucide-react';

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
      toast.success('Welcome to FANCLUB Admin');
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
      padding: '24px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--bg-card)',
          border: '3px solid var(--bauhaus-black)',
          borderRadius: '0px',
          boxShadow: 'var(--shadow-lg)',
          padding: '40px 36px',
        }}
      >
        {/* Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <span className="logo-box" style={{ fontSize: '1.6rem', height: '44px', padding: '0 12px', borderWidth: '3px', margin: 0 }}>FAN</span>
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.8rem',
            fontWeight: 900,
            letterSpacing: '1px',
            color: 'var(--text-primary)',
            textTransform: 'uppercase',
            marginTop: '8px',
          }}>
            FAN<span style={{ color: 'var(--bauhaus-red)' }}>CLUB ADMIN</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '6px', fontFamily: 'var(--font-accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Enter your credentials to access store control panel
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Admin Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-primary)' }} />
              <input
                type="email"
                required
                placeholder="admin@fanclub.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', paddingLeft: 42, borderRadius: 0, height: 46, border: '2px solid var(--bauhaus-black)' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-primary)' }} />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', paddingLeft: 42, borderRadius: 0, height: 46, border: '2px solid var(--bauhaus-black)' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', height: 48, marginTop: 8, fontSize: '0.9rem' }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
