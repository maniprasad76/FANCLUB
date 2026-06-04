import { motion } from 'framer-motion';

/**
 * SkeletonLoader — Reusable skeleton loading placeholders.
 * Uses the `.skeleton` CSS class from the Bauhaus design system (index.css).
 *
 * Available presets:
 *   - <ProductCardSkeleton />   — for product grids
 *   - <CheckoutSkeleton />      — for the checkout page
 *   - <ProfileSkeleton />       — for the profile page
 *   - <PageSkeleton />          — generic full-page loader
 */

const shimmer = {
  initial: { opacity: 0.5 },
  animate: { opacity: 1 },
  transition: { duration: 0.8, repeat: Infinity, repeatType: 'reverse' as const },
};

/* ── Product Card Skeleton ── */
export function ProductCardSkeleton() {
  return (
    <motion.div className="glass-card" style={{ padding: '0', overflow: 'hidden' }} {...shimmer}>
      <div className="skeleton" style={{ width: '100%', height: '280px', borderRadius: '0' }} />
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="skeleton" style={{ width: '70%', height: '16px' }} />
        <div className="skeleton" style={{ width: '40%', height: '14px' }} />
        <div className="skeleton" style={{ width: '30%', height: '20px', marginTop: '4px' }} />
      </div>
    </motion.div>
  );
}

/* ── Product Grid Skeleton (multiple cards) ── */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ── Checkout Skeleton ── */
export function CheckoutSkeleton() {
  return (
    <motion.div className="container" style={{ paddingTop: '40px' }} {...shimmer}>
      <div className="skeleton" style={{ width: '200px', height: '32px', marginBottom: '24px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <div className="skeleton" style={{ width: '60%', height: '20px', marginBottom: '16px' }} />
            <div className="skeleton" style={{ width: '100%', height: '80px' }} />
            <div className="skeleton" style={{ width: '100%', height: '80px', marginTop: '12px' }} />
          </div>
          <div className="glass-card" style={{ padding: '24px' }}>
            <div className="skeleton" style={{ width: '50%', height: '20px', marginBottom: '16px' }} />
            <div className="skeleton" style={{ width: '100%', height: '48px' }} />
            <div className="skeleton" style={{ width: '100%', height: '48px', marginTop: '12px' }} />
          </div>
        </div>
        <div className="glass-card" style={{ padding: '24px', height: 'fit-content' }}>
          <div className="skeleton" style={{ width: '60%', height: '20px', marginBottom: '20px' }} />
          <div className="skeleton" style={{ width: '100%', height: '24px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ width: '100%', height: '24px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ width: '100%', height: '32px', marginTop: '16px' }} />
          <div className="skeleton" style={{ width: '100%', height: '48px', marginTop: '20px', borderRadius: '0' }} />
        </div>
      </div>
    </motion.div>
  );
}

/* ── Profile Skeleton ── */
export function ProfileSkeleton() {
  return (
    <motion.div className="container" style={{ paddingTop: '40px' }} {...shimmer}>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '32px' }}>
        <div className="skeleton" style={{ width: '80px', height: '80px', borderRadius: '50%' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="skeleton" style={{ width: '180px', height: '24px' }} />
          <div className="skeleton" style={{ width: '220px', height: '16px' }} />
        </div>
      </div>
      <div className="glass-card" style={{ padding: '24px' }}>
        <div className="skeleton" style={{ width: '40%', height: '20px', marginBottom: '20px' }} />
        {Array.from({ length: 3 }).map((_, i) => (
          <div className="skeleton" key={i} style={{ width: '100%', height: '72px', marginBottom: '12px' }} />
        ))}
      </div>
    </motion.div>
  );
}

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
