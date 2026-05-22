import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { CheckCircle, Eye, EyeOff } from "lucide-react";
import AnimatedPage from "../../components/AnimatedPage";
import { supabase } from "../../lib/supabase";
import "./Auth.css";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      // Must be logged in via recovery link token
      if (!data.session && !window.location.hash.includes("access_token")) {
        toast.error("Invalid or expired reset link");
        navigate("/login");
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setSuccess(true);
      toast.success("Password successfully reset!");

      // Clear session after password update for security
      await supabase.auth.signOut();

      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedPage>
      <div className="auth-page">
        <motion.div
          className="auth-card glass-card"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          {success ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <CheckCircle
                size={48}
                color="var(--bauhaus-blue)"
                style={{ margin: "0 auto 16px" }}
              />
              <h3 className="heading-md" style={{ marginBottom: "16px" }}>
                Password Reset Complete
              </h3>
              <p className="text-muted">Redirecting you to login...</p>
            </div>
          ) : (
            <>
              <div className="auth-header">
                <h1 className="heading-lg auth-title">
                  New <span className="text-gradient">Password</span>
                </h1>
                <p className="text-muted">
                  Please enter your new password below.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="auth-form">
                <div>
                  <label className="input-label">New Password</label>
                  <div className="password-field-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="input-field"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      required
                      minLength={8}
                      id="reset-password"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      tabIndex={-1}
                      id="reset-toggle-password"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="input-label">Confirm New Password</label>
                  <div className="password-field-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="input-field"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                      minLength={8}
                      id="reset-confirm-password"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                      tabIndex={-1}
                      id="reset-toggle-confirm-password"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <div
                      className="password-strength-text"
                      style={{ color: "var(--bauhaus-red)" }}
                    >
                      Passwords do not match
                    </div>
                  )}
                  {confirmPassword &&
                    password === confirmPassword &&
                    confirmPassword.length >= 8 && (
                      <div
                        className="password-strength-text"
                        style={{ color: "#34A853" }}
                      >
                        Passwords match ✓
                      </div>
                    )}
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: "100%" }}
                  disabled={loading}
                  id="reset-submit"
                >
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatedPage>
  );
}
