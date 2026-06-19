import { useNavigate } from "react-router-dom";
import AnimatedPage from "../../components/AnimatedPage";
import { ShieldOff } from "lucide-react";
import "./AccessDenied.css";

/**
 * AccessDenied — Shown when a user attempts to access a resource
 * they don't have permission to view (403 / ownership violation).
 *
 * Provides clear messaging and navigation options instead of
 * leaving the user on a broken page.
 */
export default function AccessDenied() {
  const navigate = useNavigate();

  return (
    <AnimatedPage className="access-denied-page">
      <div className="access-denied-container">
        <div className="access-denied-icon">
          <ShieldOff />
        </div>

        <div className="access-denied-code">403</div>

        <h1 className="access-denied-title">Access Denied</h1>

        <p className="access-denied-message">
          You don't have permission to view this page or resource.
          If you believe this is an error, please contact support.
        </p>

        <div className="access-denied-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate("/")}
          >
            Go Home
          </button>
          <button
            className="btn btn-outline"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    </AnimatedPage>
  );
}
