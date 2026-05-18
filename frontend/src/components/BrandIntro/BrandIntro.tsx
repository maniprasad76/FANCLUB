import React from 'react';
import { motion } from 'framer-motion';
import './BrandIntro.css';

const BrandIntro: React.FC = () => {
  return (
    <motion.div
      className="brand-intro-overlay"
      initial={{ opacity: 1 }}
      exit={{ y: "-100vh", transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1], delay: 0.6 } }}
    >
      <div className="bauhaus-container">
        {/* Different Geometric Shapes */}
        <motion.div 
          className="bauhaus-triangle-blue"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
        />
        <motion.div 
          className="bauhaus-semi-circle-red"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1, ease: [0.33, 1, 0.68, 1], delay: 0.2 }}
        />
        <motion.div 
          className="bauhaus-quarter-circle-yellow"
          initial={{ x: "-100%", y: "-100%" }}
          animate={{ x: "0%", y: "0%" }}
          transition={{ duration: 1, ease: [0.33, 1, 0.68, 1], delay: 0.4 }}
        />

        {/* Architectural Grid Accents */}
        <motion.div className="bauhaus-grid-line gl-1" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 1, delay: 0.5 }} />
        <motion.div className="bauhaus-grid-line gl-2" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, delay: 0.6 }} />
        
        {/* Typography */}
        <div className="bauhaus-text-group">
          <div className="overflow-hidden">
            <motion.h1 
              className="bauhaus-title"
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1], delay: 0.6 }}
            >
              TFICLUB
            </motion.h1>
          </div>
          <div className="overflow-hidden">
            <motion.p 
              className="bauhaus-subtitle"
              initial={{ x: "100%" }}
              animate={{ x: "0%" }}
              transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1], delay: 0.8 }}
            >
              TELUGU FILM INDUSTRY
            </motion.p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BrandIntro;
