import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Admin Error Boundary — catches uncaught component errors
 * and displays a fallback UI instead of a white screen.
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
    console.error('[Admin ErrorBoundary] Uncaught error:', error);
    console.error('[Admin ErrorBoundary] Component stack:', info.componentStack);
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

    const isDev = import.meta.env.DEV;

    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', padding: '40px 24px',
        background: 'var(--bg-primary, #fafafa)',
      }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center', gap: '20px', maxWidth: '520px', width: '100%',
        }}>
          <div style={{
            width: '72px', height: '72px', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'var(--bauhaus-red, #dc2626)', color: 'white',
            border: '3px solid var(--bauhaus-black, #121212)',
            boxShadow: '4px 4px 0px 0px var(--bauhaus-black, #121212)',
          }}>
            <AlertTriangle size={32} />
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display, sans-serif)',
            fontSize: 'clamp(2rem, 6vw, 3rem)', fontWeight: 900,
            lineHeight: 0.9, letterSpacing: '-2px',
            textTransform: 'uppercase', color: 'var(--bauhaus-black, #121212)',
          }}>
            ADMIN ERROR
          </h1>

          <p style={{
            fontFamily: 'var(--font-body, sans-serif)',
            fontSize: '1rem', color: 'var(--text-secondary, #666)',
            lineHeight: 1.7, maxWidth: '380px',
          }}>
            Something went wrong in the admin panel. Your data is safe.
          </p>

          {isDev && this.state.error && (
            <div style={{
              width: '100%', background: '#121212',
              border: '3px solid #121212',
              boxShadow: '4px 4px 0px 0px #121212',
              padding: '16px', textAlign: 'left',
            }}>
              <p style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.7rem', fontWeight: 700,
                letterSpacing: '2px', textTransform: 'uppercase',
                color: '#999', marginBottom: '8px',
              }}>Error Details (DEV only)</p>
              <pre style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                lineHeight: 1.6, margin: 0,
              }}>
                {this.state.error.name}: {this.state.error.message}
              </pre>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
            <button className="btn btn-primary btn-lg" onClick={this.handleRetry} id="admin-error-retry">
              <RotateCcw size={16} /> Try Again
            </button>
            <button className="btn btn-outline btn-lg" onClick={this.handleGoHome} id="admin-error-home">
              <Home size={16} /> Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
}
