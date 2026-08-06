import { motion } from 'framer-motion';

/**
 * SkeletonLoader — Reusable skeleton loading placeholders.
 * Uses the `.skeleton` CSS class from the Bauhaus design system (index.css).
 */

const shimmer = {
  initial: { opacity: 0.5 },
  animate: { opacity: 1 },
  transition: { duration: 0.8, repeat: Infinity, repeatType: 'reverse' as const },
};

/* ── Generic Page Skeleton ── */
export function PageSkeleton() {
  return (
    <motion.div
      className="container"
      style={{ paddingTop: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
      {...shimmer}
    >
      <div className="skeleton" style={{ width: '240px', height: '36px' }} />
      <div className="skeleton" style={{ width: '400px', maxWidth: '90%', height: '16px' }} />
      <div style={{ width: '100%', marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="skeleton" style={{ width: '100%', height: '200px' }} />
        <div className="skeleton" style={{ width: '80%', height: '16px' }} />
        <div className="skeleton" style={{ width: '60%', height: '16px' }} />
      </div>
    </motion.div>
  );
}
