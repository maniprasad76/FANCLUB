import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Magnetic } from '../Magnetic';
import { minimalStagger, minimalItem } from '../AnimatedPage';
import { formatImageUrl } from '../../lib/utils';

interface AboutSectionProps {
  aboutImage: string | null;
}

export default function AboutSection({ aboutImage }: AboutSectionProps) {
  return (
    <motion.section
      className="section about-section"
      id="about-section"
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, amount: 0.2 }}
      variants={minimalStagger}
    >
      <div className="container about-grid">
        <motion.div className="about-text" variants={minimalItem}>
          <p className="section-subtitle">The Story</p>
          <h2 className="about-title">
            STREETWEAR <br />AS <span className="text-gradient">CINEMA</span>
          </h2>
          <p className="about-body">
            Every thread tells a story. Dedicated to the Telugu Film Industry, its legendary characters,
            and cinematic masterpieces — TFICLUB blends our rich cultural heritage with premium aesthetics.
            We don't just make clothes. We craft scenes you can wear.
          </p>
          <Magnetic strength={0.3}>
            <Link to="/about" className="btn btn-secondary btn-lg" id="about-cta">
              Our Story <ArrowRight size={14} />
            </Link>
          </Magnetic>
        </motion.div>

        <motion.div className="about-visual" variants={minimalItem}>
          <div className="about-visual-inner">
            {aboutImage ? (
              <img 
                src={formatImageUrl(aboutImage)} 
                alt="TFI Story" 
                className="about-brand-logo" 
                style={{ objectFit: 'cover', width: '100%', height: '100%', borderRadius: 0 }}
              />
            ) : (
              <div style={{ 
                width: '100%', 
                height: '100%', 
                background: 'var(--text-primary)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--border-subtle)'
              }} />
            )}
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
