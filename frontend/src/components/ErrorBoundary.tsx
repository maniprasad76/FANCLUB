import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import './ErrorBoundary.css';

/* ─── Types ─── */
interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback component */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global React Error Boundary — catches uncaught component errors
 * and displays a branded fallback UI instead of a blank white screen.
 *
 * Wrap this around `<AppShell />` in App.tsx so that nav, footer, and
 * layout still render if a route-level component crashes.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log error details — in production, pipe this to an observability service
    console.error('[ErrorBoundary] Uncaught error:', error);
    console.error('[ErrorBoundary] Component stack:', info.componentStack);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  private handleGoHome = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // Allow custom fallback
    if (this.props.fallback) {
      return this.props.fallback;
    }

    const isDev = import.meta.env.DEV;

    return (
      <div className="error-boundary">
        {/* Geometric decorations — Bauhaus style */}
        <div className="error-boundary__geo error-boundary__geo--circle" />
        <div className="error-boundary__geo error-boundary__geo--square" />
        <div className="error-boundary__geo error-boundary__geo--triangle" />

        <div className="error-boundary__content">
          {/* Icon */}
          <div className="error-boundary__icon-wrap">
            <AlertTriangle size={32} />
          </div>

          {/* Heading */}
          <h1 className="error-boundary__title">
            SOME<span className="text-gradient">THING</span> BROKE
          </h1>

          <p className="error-boundary__subtitle">
            We hit an unexpected error. Don't worry — your data is safe.
          </p>

          {/* Dev-only error details */}
          {isDev && this.state.error && (
            <div className="error-boundary__details">
              <p className="error-boundary__details-label">Error Details (DEV only)</p>
              <pre className="error-boundary__details-pre">
                {this.state.error.name}: {this.state.error.message}
              </pre>
            </div>
          )}

          {/* Actions */}
          <div className="error-boundary__actions">
            <button
              className="btn btn-primary btn-lg"
              onClick={this.handleRetry}
              id="error-boundary-retry"
            >
              <RotateCcw size={16} /> Try Again
            </button>
            <button
              className="btn btn-outline btn-lg"
              onClick={this.handleGoHome}
              id="error-boundary-home"
            >
              <Home size={16} /> Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }
}
