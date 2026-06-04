import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import { ArrowRight, Square, Users, Star, Shield } from 'lucide-react';
import { Magnetic } from '../Magnetic';
import { cinematicStagger, cinematicItem } from '../AnimatedPage';

interface HeroSectionProps {
  heroRef: React.RefObject<HTMLElement | null>;
  heroBgY: MotionValue<number>;
  heroScale: MotionValue<number>;
  heroOpacity: MotionValue<number>;
}

export default function HeroSection({ heroRef, heroBgY, heroScale, heroOpacity }: HeroSectionProps) {
  const [heroVideoError, setHeroVideoError] = useState(false);

  return (
    <section className="hero" id="hero-section" ref={heroRef}>
      {/* Background media */}
      <motion.div className="hero-bg" style={{ y: heroBgY, scale: heroScale }}>
        {!heroVideoError ? (
          <video
            className="hero-media"
            src="/assets/hero-media.mp4"
            autoPlay
            muted
            loop
            playsInline
            onError={() => setHeroVideoError(true)}
          />
        ) : (
          <img
            className="hero-media"
            src="/assets/hero-banner.jpg"
            alt="FANCLUB"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        <div className="hero-gradient-overlay" />
      </motion.div>

      {/* Geometric decorations */}
      <div className="hero-geo hero-geo-circle" />
      <div className="hero-geo hero-geo-square" />
      <div className="hero-geo hero-geo-triangle" />

      {/* Content */}
      <motion.div
        className="hero-content container"
        style={{ opacity: heroOpacity }}
        variants={cinematicStagger}
        initial="initial"
        animate="animate"
      >
        <motion.span className="hero-badge" variants={cinematicItem}>
          <Square size={8} fill="currentColor" /> NEW COLLECTION
        </motion.span>

        <motion.h1 className="hero-title" variants={cinematicItem}>
          FAN<span className="text-gradient">CLUB</span>
        </motion.h1>

        <motion.p className="hero-tagline" variants={cinematicItem}>
          Be Your Own Style
        </motion.p>

        <motion.div className="hero-actions" variants={cinematicItem}>
          <Magnetic strength={0.35}>
            <Link to="/shop" className="btn btn-primary btn-lg" id="hero-cta">
              Explore Collection <ArrowRight size={16} />
            </Link>
          </Magnetic>
        </motion.div>

        {/* Social Proof — Trust counter */}
        <motion.div className="hero-trust-stats" variants={cinematicItem}>
          <div className="trust-stat"><Users size={14} /> <span>10,000+ Happy Customers</span></div>
          <div className="trust-stat"><Star size={14} /> <span>4.8★ Average Rating</span></div>
          <div className="trust-stat"><Shield size={14} /> <span>100% Genuine Products</span></div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <div className="hero-scroll-cue">
        <div className="scroll-line" />
      </div>
    </section>
  );
}

