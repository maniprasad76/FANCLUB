import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import AnimatedPage from "../../components/AnimatedPage";
import { useAuth } from "../../context/AuthContext";
import "./Auth.css";

const GoogleIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const FacebookIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H7.6v-3h2.4V9.41c0-2.36 1.4-3.66 3.56-3.66 1.04 0 2.13.19 2.13.19v2.34h-1.2c-1.18 0-1.55.73-1.55 1.48V12h2.64l-.42 3h-2.22v6.8c4.56-.93 8-4.96 8-9.8z"
      fill="#1877F2"
    />
  </svg>
);

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState<
    "not-found" | "wrong-password" | "generic" | ""
  >("");
  const [loading, setLoading] = useState(false);
  const { login, socialLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Where to redirect after successful login
  const redirectTo = searchParams.get("redirect") || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setErrorType("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(redirectTo);
    } catch (err: any) {
      let msg = err.response?.data?.message || "Invalid credentials";
      if (Array.isArray(msg)) msg = msg[0];
      if (typeof msg !== 'string') msg = "Invalid credentials";

      setError(msg);
      // Detect specific error types for better UX
      if (
        msg.toLowerCase().includes("no account found") ||
        msg.toLowerCase().includes("sign up")
      ) {
        setErrorType("not-found");
      } else if (
        msg.toLowerCase().includes("incorrect password") ||
        msg.toLowerCase().includes("reset")
      ) {
        setErrorType("wrong-password");
      } else {
        setErrorType("generic");
      }
    }
    setLoading(false);
  };

  return (
    <AnimatedPage>
      <div className="auth-page" id="login-page">
        <motion.div
          className="auth-card glass-card"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="auth-header">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "24px",
              }}
            >
              <span
                className="logo-box"
                style={{
                  height: "40px",
                  fontSize: "1.5rem",
                  padding: "0 10px",
                }}
              >
                FAN
              </span>
              <span
                className="logo-text-out"
                style={{ fontSize: "1.5rem", marginLeft: "8px" }}
              >
                CLUB
              </span>
            </div>
            <h1 className="heading-lg auth-title">
              Welcome <span className="text-gradient">Back</span>
            </h1>
            <p className="text-muted">Sign in to your FANCLUB account</p>
          </div>

          {error && (
            <div className="auth-error">
              {error}
              {errorType === "not-found" && (
                <div style={{ marginTop: "8px" }}>
                  <Link
                    to={`/register${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
                    style={{ color: "var(--bauhaus-blue)", fontWeight: 700 }}
                  >
                    Create an account →
                  </Link>
                </div>
              )}
              {errorType === "wrong-password" && (
                <div style={{ marginTop: "8px" }}>
                  <Link
                    to="/forgot-password"
                    style={{ color: "var(--bauhaus-blue)", fontWeight: 700 }}
                  >
                    Reset your password →
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div>
              <label className="input-label">Email</label>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                id="login-email"
              />
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "6px",
                }}
              >
                <label className="input-label" style={{ marginBottom: 0 }}>
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--bauhaus-blue)",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="password-field-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  id="login-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                  id="login-toggle-password"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: "100%" }}
              disabled={loading}
              id="login-submit"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="auth-divider">Or continue with</div>
          <div className="social-login-container">
            <button
              type="button"
              className="btn-social"
              onClick={() => socialLogin("google")}
              id="login-google"
            >
              <GoogleIcon /> Google
            </button>
            <button
              type="button"
              className="btn-social"
              onClick={() => socialLogin("facebook")}
              id="login-facebook"
            >
              <FacebookIcon /> Facebook
            </button>
          </div>

          <p className="auth-switch">
            Don't have an account?{" "}
            <Link
              to={`/register${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
            >
              Sign Up
            </Link>
          </p>

          <div className="auth-policy-links">
            <Link to="/terms">Terms & Conditions</Link>
            <span>•</span>
            <Link to="/privacy">Privacy Policy</Link>
          </div>
        </motion.div>
      </div>
    </AnimatedPage>
  );
}
