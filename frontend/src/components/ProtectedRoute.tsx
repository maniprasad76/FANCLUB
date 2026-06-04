import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PageSkeleton } from "./SkeletonLoader";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute — Redirects unauthenticated users to /login.
 * Preserves the intended destination so we can redirect back after login.
 * Shows a branded skeleton while auth state is resolving (prevents blank flash).
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // While auth state is loading, show branded skeleton instead of blank screen
  if (loading) {
    return <PageSkeleton />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}

