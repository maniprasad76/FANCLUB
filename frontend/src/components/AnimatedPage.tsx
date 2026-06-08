import { motion } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';

const fandomticEase: [number, number, number, number] = [0.22, 1, 0.36, 1];
const exitEase: [number, number, number, number] = [0.4, 0, 1, 1];

const pageVariants = {
  initial: { opacity: 0, y: 56, scale: 0.985, filter: 'blur(8px)' },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.85,
      ease: fandomticEase,
      when: 'beforeChildren',
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    y: -28,
    scale: 0.992,
    filter: 'blur(6px)',
    transition: {
      duration: 0.45,
      ease: exitEase,
    },
  },
};

export const fandomticStagger = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1,
      delayChildren: 0.06,
    },
  },
};

export const fandomticItem = {
  initial: { opacity: 0, y: 32, scale: 0.985, filter: 'blur(8px)' },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.75,
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
      style={{ position: 'relative', ...style }}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}
