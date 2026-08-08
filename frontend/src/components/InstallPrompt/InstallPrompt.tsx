import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share, Home, Smartphone } from "lucide-react";
import "./InstallPrompt.css";

const DISMISS_KEY = "fan_install_dismissed_at";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  );
}

/**
 * Prompts mobile shoppers to install FANCLUB as an app.
 * - Android/Chrome: captures the `beforeinstallprompt` event and fires it.
 * - iOS Safari: no install event exists, so we show instructions
 *   (Share → Add to Home Screen) after a gentle delay.
 * Dismissals are remembered for one week to avoid nagging.
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const dismissedRef = useRef(false);

  useEffect(() => {
    if (isStandalone()) return;
    try {
      const last = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (Date.now() - last < WEEK_MS) return;
    } catch {
      // storage unavailable — show anyway
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    // iOS fallback: show after a few seconds on the first visit of a session
    let iosTimer: ReturnType<typeof setTimeout> | undefined;
    if (isIOS() && !sessionStorage.getItem("fan_install_ios_shown")) {
      iosTimer = setTimeout(() => {
        if (dismissedRef.current) return;
        sessionStorage.setItem("fan_install_ios_shown", "1");
        setShowBanner(true);
      }, 9000);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  const dismiss = () => {
    dismissedRef.current = true;
    setShowBanner(false);
    setShowIosHelp(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try {
        await deferredPrompt.userChoice;
      } catch {
        // user dismissed the native prompt
      }
      setDeferredPrompt(null);
      setShowBanner(false);
    } else if (isIOS()) {
      setShowIosHelp(true);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            className="install-banner"
            role="dialog"
            aria-label="Install FANCLUB app"
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            <div className="install-banner-icon">
              <Smartphone size={18} />
            </div>
            <div className="install-banner-body">
              <strong>Get the FANCLUB app</strong>
              <span>Fast access, offline-ready, one tap away.</span>
            </div>
            <button className="install-banner-btn" onClick={handleInstall}>
              <Download size={14} /> Install
            </button>
            <button
              className="install-banner-close"
              onClick={dismiss}
              aria-label="Not now"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS instructions modal */}
      <AnimatePresence>
        {showIosHelp && (
          <motion.div
            className="install-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowIosHelp(false)}
          >
            <motion.div
              className="install-modal"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="install-modal-close"
                onClick={() => setShowIosHelp(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
              <div className="install-modal-icon">
                <Home size={26} />
              </div>
              <h3>Add FANCLUB to your Home Screen</h3>
              <ol className="install-steps">
                <li>
                  Tap the <Share size={14} /> Share button in Safari's toolbar
                </li>
                <li>
                  Choose <strong>“Add to Home Screen”</strong>
                </li>
                <li>Tap Add — FANCLUB opens like an app!</li>
              </ol>
              <button className="install-modal-btn" onClick={() => setShowIosHelp(false)}>
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
