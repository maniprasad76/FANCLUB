import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { CheckCircle } from 'lucide-react';
import AnimatedPage from '../../components/AnimatedPage';
import { supabase } from '../../lib/supabase';
import './Auth.css';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      // Must be logged in via recovery link token
      if (!data.session && !window.location.hash.includes('access_token')) {
        toast.error('Invalid or expired reset link');
        navigate('/login');
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      setSuccess(true);
      toast.success('Password successfully reset!');
      
      // Clear session after password update for security
      await supabase.auth.signOut();
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedPage>
      <div className="auth-page">
        <motion.div className="auth-card glass-card" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          {success ? (
             <div style={{ textAlign: 'center', padding: '20px 0' }}>
               <CheckCircle size={48} color="var(--bauhaus-blue)" style={{ margin: '0 auto 16px' }} />
               <h3 className="heading-md" style={{ marginBottom: '16px' }}>Password Reset Complete</h3>
               <p className="text-muted">Redirecting you to login...</p>
             </div>
          ) : (
            <>
              <div className="auth-header">
                <h1 className="heading-lg auth-title">New <span className="text-gradient">Password</span></h1>
                <p className="text-muted">Please enter your new password below.</p>
              </div>
              <form onSubmit={handleSubmit} className="auth-form">
                <div>
                  <label className="input-label">New Password</label>
                  <input 
                    type="password" 
                    className="input-field" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    required 
                  />
                </div>
                <div>
                  <label className="input-label">Confirm New Password</label>
                  <input 
                    type="password" 
                    className="input-field" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    placeholder="••••••••" 
                    required 
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatedPage>
  );
}
