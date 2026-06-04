import { motion } from 'framer-motion';
import { type ReactNode } from 'react';
import { type LucideIcon, ShoppingBag, Heart, Package, Search, FileQuestion } from 'lucide-react';
import { cinematicItem } from './AnimatedPage';

/**
 * EmptyState — Generic reusable empty state component.
 * Provides a consistent look for empty carts, wishlists, search results, etc.
 */

interface EmptyStateProps {
  /** Lucide icon to display — defaults to ShoppingBag */
  icon?: LucideIcon;
  /** Main heading text */
  title: string;
  /** Descriptive subtitle */
  subtitle?: string;
  /** Optional CTA button */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'outline';
  };
  /** Any custom children to render below */
  children?: ReactNode;
}

export default function EmptyState({
  icon: Icon = ShoppingBag,
  title,
  subtitle,
  action,
  children,
}: EmptyStateProps) {
  return (
    <motion.div
      className="glass-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '60px 32px',
        minHeight: '300px',
        gap: '16px',
      }}
      variants={cinematicItem}
      initial="initial"
      animate="animate"
    >
      <motion.div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'var(--bauhaus-yellow)',
          border: '3px solid var(--bauhaus-black)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '8px',
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
      >
        <Icon size={28} strokeWidth={2.5} />
      </motion.div>

      <h2 className="heading-md" style={{ marginBottom: '0' }}>{title}</h2>

      {subtitle && (
        <p className="text-muted" style={{ maxWidth: '360px', lineHeight: 1.6 }}>
          {subtitle}
        </p>
      )}

      {action && (
        <button
          className={`btn ${action.variant === 'outline' ? 'btn-outline' : 'btn-primary'}`}
          onClick={action.onClick}
          style={{ marginTop: '8px' }}
        >
          {action.label}
        </button>
      )}

      {children}
    </motion.div>
  );
}

/* ── Preset Empty States ── */

export function EmptyCart({ onShop }: { onShop: () => void }) {
  return (
    <EmptyState
      icon={ShoppingBag}
      title="Your cart is empty"
      subtitle="Looks like you haven't added any items yet. Browse our collection and add your favorites!"
      action={{ label: 'Start Shopping', onClick: onShop }}
    />
  );
}

export function EmptyWishlist({ onShop }: { onShop: () => void }) {
  return (
    <EmptyState
      icon={Heart}
      title="No saved items"
      subtitle="Save products you love to your wishlist and come back to them anytime."
      action={{ label: 'Explore Products', onClick: onShop }}
    />
  );
}

export function EmptyOrders() {
  return (
    <EmptyState
      icon={Package}
      title="No orders yet"
      subtitle="Your order history will appear here once you make your first purchase."
    />
  );
}

export function EmptySearchResults({ query }: { query: string }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      subtitle={`We couldn't find any products matching "${query}". Try a different search term.`}
    />
  );
}

export function NotFoundState({ onHome }: { onHome: () => void }) {
  return (
    <EmptyState
      icon={FileQuestion}
      title="Page not found"
      subtitle="The page you're looking for doesn't exist or has been moved."
      action={{ label: 'Go Home', onClick: onHome, variant: 'outline' }}
    />
  );
}
