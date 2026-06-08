import React from 'react';
import { motion, Variants } from 'framer-motion';
import './BrandIntro.css';

const cubicEase1: [number, number, number, number] = [0.215, 0.61, 0.355, 1];
const cubicEase2: [number, number, number, number] = [0.16, 1, 0.3, 1];

const BrandIntro: React.FC = () => {
  const titleLetters = Array.from("FANCLUB");

  const titleContainerVariants: Variants = {
    animate: {
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.15,
      }
    }
  };

  const letterVariants: Variants = {
    initial: { 
      opacity: 0, 
      y: 35,
      filter: "blur(12px)",
      scale: 0.9
    },
    animate: { 
      opacity: 1, 
      y: 0,
      filter: "blur(0px)",
      scale: 1,
      transition: { 
        duration: 0.75, 
        ease: cubicEase1 
      } 
    }
  };

  const subtitleVariants: Variants = {
    initial: { 
      opacity: 0, 
      letterSpacing: "18px",
      y: 10,
      filter: "blur(6px)"
    },
    animate: { 
      opacity: 1, 
      letterSpacing: "6px",
      y: 0,
      filter: "blur(0px)",
      transition: { 
        duration: 1.1, 
        ease: cubicEase2,
        delay: 0.65
      } 
    }
  };

  const lineVariants: Variants = {
    initial: { scaleX: 0 },
    animate: { 
      scaleX: 1,
      transition: { 
        duration: 0.9, 
        ease: cubicEase2,
        delay: 1.0
      } 
    }
  };

  const flareVariants: Variants = {
    initial: { opacity: 0, scale: 0.8, x: "-50%", y: "-50%" },
    animate: { 
      opacity: [0, 0.35, 0.2],
      scale: [0.8, 1.15, 1],
      transition: { 
        duration: 2.2, 
        ease: "easeOut" as const
      } 
    }
  };

  return (
    <motion.div
      className="brand-intro-overlay"
      initial={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        scale: 1.06,
        filter: "blur(16px)",
        transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] } 
      }}
    >
      {/* Fandomtic Ambient Glow */}
      <div className="fandomtic-ambient-glow-red" />
      <div className="fandomtic-ambient-glow-blue" />
      
      {/* Central Flare Shimmer */}
      <motion.div 
        className="fandomtic-shimmer"
        variants={flareVariants}
        initial="initial"
        animate="animate"
      />

      <div className="fandomtic-container">
        {/* Typographic Group */}
        <div className="fandomtic-text-group">
          {/* Title letter-by-letter stagger */}
          <motion.div 
            className="fandomtic-title-container"
            variants={titleContainerVariants}
            initial="initial"
            animate="animate"
          >
            {titleLetters.map((char, index) => (
              <motion.span 
                key={index}
                className="fandomtic-letter"
                variants={letterVariants}
              >
                {char}
              </motion.span>
            ))}
          </motion.div>

          {/* Subtitle Reveal */}
          <div className="fandomtic-subtitle-wrapper">
            <motion.p 
              className="fandomtic-subtitle"
              variants={subtitleVariants}
              initial="initial"
              animate="animate"
            >
              BE YOUR OWN STYLE
            </motion.p>
          </div>

          {/* Premium Minimal Brand Line */}
          <motion.div 
            className="fandomtic-brand-line"
            variants={lineVariants}
            initial="initial"
            animate="animate"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default BrandIntro;
