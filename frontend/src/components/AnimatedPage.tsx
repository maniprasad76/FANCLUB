import { motion } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';

const fandomticEase: [number, number, number, number] = [0.22, 1, 0.36, 1];
const exitEase: [number, number, number, number] = [0.4, 0, 1, 1];

/*
 * Performance-optimized page variants:
 * - Removed filter: blur() — triggers expensive layer compositing and paint operations
 * - Sub-300ms transitions — instant-feeling navigation, no waiting on animations
 * - Only animate transform + opacity — GPU-accelerated, no layout/paint triggered
 */
const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.995 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.22,
      ease: fandomticEase,
      when: 'beforeChildren',
      staggerChildren: 0.04,
      delayChildren: 0.01,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.997,
    transition: {
      duration: 0.12,
      ease: exitEase,
    },
  },
};

export const fandomticStagger = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.25,
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

export const fandomticItem = {
  initial: { opacity: 0, y: 16, scale: 0.995 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.28,
      ease: fandomticEase,
    },
  },
};

interface AnimatedPageProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export default function AnimatedPage({ children, className = '', style }: AnimatedPageProps) {
  const isHome = className.includes('home-page');
  const finalClass = isHome ? className : `${className} standard-page-padding`.trim();

  return (
    <motion.div
      className={finalClass}
      style={{ position: 'relative', willChange: 'transform, opacity', ...style }}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}
