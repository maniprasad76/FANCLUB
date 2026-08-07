import { useEffect } from "react";
import { motion } from "framer-motion";
import "./BrandIntro.css";

interface BrandIntroProps {
  onDone: () => void;
}

export default function BrandIntro({ onDone }: BrandIntroProps) {
  useEffect(() => {
    // Auto-dismiss after 2.4s
    const timer = setTimeout(() => {
      onDone();
    }, 2400);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      className="brand-intro-overlay"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
    >
      {/* Glow Ambient Layer */}
      <motion.div
        className="intro-glow-bg"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1.1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />

      {/* Skip Button */}
      <motion.button
        className="intro-skip-btn"
        onClick={onDone}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        SKIP
      </motion.button>

      {/* Main Content Center */}
      <div className="intro-content">
        <div className="intro-logo-cluster">
          {/* FAN Box Badge Animation */}
          <motion.div
            className="intro-fan-box"
            initial={{ scale: 0, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 18,
              delay: 0.15,
            }}
          >
            FAN
          </motion.div>

          {/* CLUB Kinetic Text Entry */}
          <motion.span
            className="intro-club-text"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
          >
            CLUB
          </motion.span>
        </div>

        {/* Tagline "BE YOUR OWN STYLE" */}
        <motion.div
          className="intro-tagline-box"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.65, ease: "easeOut" }}
        >
          <span className="intro-tagline-yellow">BE YOUR OWN</span>
          <span className="intro-tagline-blue">STYLE</span>
        </motion.div>

        {/* Subcaption */}
        <motion.div
          className="intro-subcaption"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          SCREEN CULTURE • STREETWEAR
        </motion.div>
      </div>

      {/* Bottom Loading Bar Indicator */}
      <div className="intro-progress-container">
        <motion.div
          className="intro-progress-bar"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.3, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}
