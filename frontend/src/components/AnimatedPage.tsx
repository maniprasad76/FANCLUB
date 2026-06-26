import { motion } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';

const fandomticEase: [number, number, number, number] = [0.22, 1, 0.36, 1];
const exitEase: [number, number, number, number] = [0.4, 0, 1, 1];

/*
 * Performance-optimized page variants:
 * - Removed filter: blur() — triggers expensive layer compositing and paint operations
 * - Shortened durations — 0.5s enter (was 0.85s), 0.25s exit (was 0.45s)
 * - Only animate transform + opacity — GPU-accelerated, no layout/paint triggered
 */
const pageVariants = {
  initial: { opacity: 0, y: 32, scale: 0.99 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: fandomticEase,
      when: 'beforeChildren',
      staggerChildren: 0.06,
      delayChildren: 0.02,
    },
  },
  exit: {
    opacity: 0,
    y: -16,
    scale: 0.995,
    transition: {
      duration: 0.25,
      ease: exitEase,
    },
  },
};

export const fandomticStagger = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.4,
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

export const fandomticItem = {
  initial: { opacity: 0, y: 24, scale: 0.99 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
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
