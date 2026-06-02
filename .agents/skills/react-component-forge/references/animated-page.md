# AnimatedPage & Framer Motion Reference

> Extracted from `frontend/src/components/AnimatedPage.tsx` (83 lines)

## Exported Animation Presets

### Page Transition Variants (`pageVariants`) — Internal
Used automatically by `<AnimatedPage>`. Not exported.

```typescript
const cinematicEase = [0.22, 1, 0.36, 1];  // Cinematic cubic-bezier
const exitEase = [0.4, 0, 1, 1];

const pageVariants = {
  initial: { opacity: 0, y: 56, scale: 0.985, filter: 'blur(8px)' },
  animate: {
    opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
    transition: {
      duration: 0.85,
      ease: cinematicEase,
      when: 'beforeChildren',
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
  exit: {
    opacity: 0, y: -28, scale: 0.992, filter: 'blur(6px)',
    transition: { duration: 0.45, ease: exitEase },
  },
};
```

### `cinematicStagger` — Exported
For wrapping a group of items that should stagger in:

```typescript
export const cinematicStagger = {
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
```

### `cinematicItem` — Exported
For individual items within a staggered group:

```typescript
export const cinematicItem = {
  initial: { opacity: 0, y: 32, scale: 0.985, filter: 'blur(8px)' },
  animate: {
    opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
    transition: {
      duration: 0.75,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};
```

## Component API

```typescript
interface AnimatedPageProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}
```

### Auto-Padding Logic
- If `className` contains `'home-page'` → NO `standard-page-padding` class applied
- All other pages → `standard-page-padding` class is automatically appended

```typescript
const isHome = className.includes('home-page');
const finalClass = isHome ? className : `${className} standard-page-padding`.trim();
```

### What `standard-page-padding` does (from `index.css`)
```css
.standard-page-padding {
  padding-top: calc(var(--nav-height) + 24px);
  padding-bottom: 80px;
  min-height: 100vh;
}
```

## Usage Pattern

```tsx
import AnimatedPage, { cinematicItem, cinematicStagger } from '../../components/AnimatedPage';
import { motion } from 'framer-motion';

export default function ShopPage() {
  return (
    <AnimatedPage className="shop-page">
      {/* Header — auto-staggered by AnimatedPage */}
      <motion.h1 variants={cinematicItem}>Shop</motion.h1>

      {/* Product grid — explicitly staggered */}
      <motion.div className="product-grid" variants={cinematicStagger}>
        {products.map((p) => (
          <motion.div key={p.id} variants={cinematicItem}>
            <ProductCard product={p} />
          </motion.div>
        ))}
      </motion.div>
    </AnimatedPage>
  );
}
```

## Key Animation Values

| Animation | Duration | Easing | Effect |
|-----------|----------|--------|--------|
| Page enter | 0.85s | `[0.22, 1, 0.36, 1]` | Fade + slide up 56px + scale + blur |
| Page exit | 0.45s | `[0.4, 0, 1, 1]` | Fade + slide up 28px + blur |
| Item enter | 0.75s | `[0.22, 1, 0.36, 1]` | Fade + slide up 32px + scale + blur |
| Stagger delay | 0.08s | — | Between sibling children |
| Child delay | 0.04s | — | Before first child starts |
