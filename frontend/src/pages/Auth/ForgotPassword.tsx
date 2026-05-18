import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Mail, ArrowLeft } from 'lucide-react';
import AnimatedPage from '../../components/AnimatedPage';
import api from '../../lib/api';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', {
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedPage>
      <div className="auth-page">
        <motion.div className="auth-card glass-card" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <div className="auth-header">
            <h1 className="heading-lg auth-title">Reset <span className="text-gradient">Password</span></h1>
            <p className="text-muted">Enter your email to receive a reset link</p>
          </div>
          
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Mail size={48} color="var(--bauhaus-red)" style={{ margin: '0 auto 16px' }} />
              <h3 className="heading-md" style={{ marginBottom: '16px' }}>Check your email</h3>
              <p className="text-muted" style={{ marginBottom: '24px' }}>
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <Link to="/login" className="btn btn-outline" style={{ width: '100%' }}>
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <div>
                <label className="input-label">Email Address</label>
                <input 
                  type="email" 
                  className="input-field" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="you@email.com" 
                  required 
                />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              
              <Link to="/login" className="auth-switch" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatedPage>
  );
}
