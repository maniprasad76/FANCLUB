import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * TopProgressBar — Animated illusion of page loading progress on route change.
 * Shows a thin red bar at the top of the viewport during navigation.
 */
export default function TopProgressBar() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(30);
    const t1 = setTimeout(() => setProgress(70), 200);
    const t2 = setTimeout(() => setProgress(100), 500);
    const t3 = setTimeout(() => setProgress(0), 800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [location.pathname]);

  if (progress === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        background: "rgba(255,255,255,0.1)",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          background: "linear-gradient(to right, var(--bauhaus-red), var(--bauhaus-blue), var(--bauhaus-yellow), var(--bauhaus-green))",
          width: `${progress}%`,
          transition: "width 0.3s ease-out",
        }}
      />
    </div>
  );
}
