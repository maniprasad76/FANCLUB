import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import './OfflineIndicator.css';

/**
 * OfflineIndicator — Shows a branded banner when the user loses internet.
 *
 * Critical for e-commerce — prevents users from submitting orders,
 * making payments, or updating their cart while disconnected.
 *
 * Features:
 *   - Slides in from top when offline
 *   - Shows "Back online" confirmation briefly when reconnected
 *   - Bauhaus-styled to match the design system
 */
export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasEverOffline, setWasEverOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasEverOffline) {
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasEverOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasEverOffline]);

  // Don't render anything if online and no reconnection message to show
  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={`offline-indicator ${isOnline ? 'offline-indicator--online' : 'offline-indicator--offline'}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="offline-indicator__content">
        {isOnline ? (
          <>
            <Wifi size={16} />
            <span>Back online — you're all set!</span>
          </>
        ) : (
          <>
            <WifiOff size={16} />
            <span>You're offline — check your connection</span>
          </>
        )}
      </div>
    </div>
  );
}
