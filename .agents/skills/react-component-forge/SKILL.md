---
name: react-component-forge
description: "React frontend component patterns for TFI Club. ACTIVATE when: creating new React pages/components, styling with CSS variables, adding Framer Motion animations, setting up React Router routes, using Axios API calls, managing auth/cart state, implementing responsive layouts, adding toast notifications, working with Lucide icons, building product cards/grids, or creating modals/drawers. Triggers: React, JSX, TSX, Vite, Framer Motion, AnimatedPage, CSS variables, bauhaus, component, page."
metadata:
  author: tfi-team
  version: "1.0.0"
---

# React Component Forge — TFI Club Frontend

## Creating a New Page

### Step 1: Create the Page Component

```tsx
// pages/FeatureName/FeatureName.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AnimatedPage, { cinematicItem } from '../../components/AnimatedPage';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import './FeatureName.css';

export default function FeatureName() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/features');
      setData(res.data.items);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedPage className="feature-page">
      <div className="container">
        {/* Section header */}
        <motion.div className="section-header" variants={cinematicItem}>
          <p className="section-subtitle">Our Features</p>
          <h1 className="section-title">Feature Name</h1>
          <div className="section-divider" />
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="product-grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 300 }} />
            ))}
          </div>
        ) : (
          <div className="product-grid">
            {data.map((item) => (
              <motion.div key={item.id} className="glass-card" variants={cinematicItem}>
                {/* Card content */}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
```

### Step 2: Create the CSS File

```css
/* pages/FeatureName/FeatureName.css */

.feature-page {
  /* page uses standard-page-padding from AnimatedPage automatically */
}

.feature-page .feature-header {
  margin-bottom: 48px;
}

.feature-page .feature-card {
  padding: 24px;
  background: var(--bauhaus-white);
  border: 2px solid var(--bauhaus-black);
  box-shadow: var(--shadow-md);
  transition: transform var(--transition-base);
}

.feature-page .feature-card:hover {
  transform: translateY(-4px);
}

.feature-page .feature-card .feature-title {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 900;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.feature-page .feature-card .feature-price {
  font-family: var(--font-mono);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--bauhaus-red);
}

/* Responsive */
@media (max-width: 768px) {
  .feature-page .feature-card {
    padding: 16px;
  }
}
```

### Step 3: Register the Route in App.tsx

```tsx
// In App.tsx, add the import:
import FeatureName from './pages/FeatureName/FeatureName';

// Add route in <Routes>:
<Route path="/feature" element={<FeatureName />} />

// If it requires authentication:
<Route path="/feature" element={
  <ProtectedRoute>
    <FeatureName />
  </ProtectedRoute>
} />
```

---

## Design System Reference

### Color Variables (Bauhaus Constructivist)
```css
--bauhaus-red: #d02020;       /* Primary accent, CTA buttons, alerts */
--bauhaus-blue: #1040c0;      /* Secondary buttons, badges, links */
--bauhaus-yellow: #f0c020;    /* Warnings, highlights, hover states */
--bauhaus-black: #121212;     /* Borders, shadows, text */
--bauhaus-white: #ffffff;     /* Backgrounds, cards */
--bg-primary: #f0f0f0;        /* Page background */
--text-primary: #121212;      /* Main text */
--text-secondary: #444444;    /* Muted text */
--text-muted: #777777;        /* Least important text */
```

### Typography Rules
| Element | Font | Usage |
|---------|------|-------|
| `--font-display` | Space Grotesk | Headlines, page titles, hero text |
| `--font-body` | Inter | Body text, descriptions, paragraphs |
| `--font-accent` | Outfit | Buttons, nav items, labels, badges |
| `--font-mono` | JetBrains Mono | Prices, order numbers, tracking IDs |
| `--font-editorial` | Playfair Display | Quotes, testimonials, about text |

### Button Classes
```html
<!-- Primary CTA (red background) -->
<button className="btn btn-primary">Add to Cart</button>

<!-- Secondary (blue background) -->
<button className="btn btn-secondary">Learn More</button>

<!-- Outline (white background, black border) -->
<button className="btn btn-outline">View Details</button>

<!-- Ghost (no border) -->
<button className="btn btn-ghost">Cancel</button>

<!-- Sizes -->
<button className="btn btn-primary btn-lg">Large Button</button>
<button className="btn btn-primary btn-sm">Small Button</button>

<!-- Icon button -->
<button className="btn-icon"><ShoppingBag size={20} /></button>
```

### Card Pattern
```html
<div className="glass-card" style={{ padding: '24px' }}>
  {/* White background, black border, hard shadow, hover lift */}
</div>
```

### Input Pattern
```html
<label className="input-label">Email Address</label>
<input className="input-field" type="email" placeholder="you@example.com" />
```

### Badge Pattern
```html
<span className="badge badge-primary">New</span>
<span className="badge badge-success">In Stock</span>
<span className="badge badge-warning">Low Stock</span>
<span className="badge badge-danger">Sold Out</span>
```

---

## Framer Motion Patterns

### Page Transitions (Automatic via AnimatedPage)
```tsx
import AnimatedPage from '../../components/AnimatedPage';

// Wrapping a page — handles enter/exit animations automatically
<AnimatedPage className="my-page">
  {children}
</AnimatedPage>
```

### Staggered List Animation
```tsx
import { motion } from 'framer-motion';
import { cinematicStagger, cinematicItem } from '../../components/AnimatedPage';

<motion.div variants={cinematicStagger} initial="initial" animate="animate">
  {items.map((item) => (
    <motion.div key={item.id} variants={cinematicItem}>
      {/* Item content */}
    </motion.div>
  ))}
</motion.div>
```

### Hover Animation
```tsx
<motion.div
  whileHover={{ y: -4, boxShadow: '8px 8px 0px 0px #121212' }}
  whileTap={{ y: 0, boxShadow: '2px 2px 0px 0px #121212' }}
  transition={{ duration: 0.15 }}
>
  {/* Interactive content */}
</motion.div>
```

### Scroll-Triggered Animation
```tsx
<motion.div
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: '-50px' }}
  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
>
  {/* Reveals on scroll */}
</motion.div>
```

### AnimatePresence for Conditionals
```tsx
import { AnimatePresence, motion } from 'framer-motion';

<AnimatePresence mode="wait">
  {isVisible && (
    <motion.div
      key="modal"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {/* Modal content */}
    </motion.div>
  )}
</AnimatePresence>
```

---

## API Call Patterns

### GET Request with Loading State
```tsx
const [data, setData] = useState<Product[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  api.get('/products', { params: { page: 1, limit: 20 } })
    .then((res) => setData(res.data.items))
    .catch(() => toast.error('Failed to load products'))
    .finally(() => setLoading(false));
}, []);
```

### POST Request
```tsx
const handleSubmit = async () => {
  try {
    setSubmitting(true);
    const { data } = await api.post('/features', formData);
    toast.success('Feature created!');
    navigate(`/feature/${data.id}`);
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Something went wrong');
  } finally {
    setSubmitting(false);
  }
};
```

### PUT/PATCH Request
```tsx
const handleUpdate = async () => {
  try {
    await api.put(`/features/${id}`, updatedData);
    toast.success('Updated successfully');
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Update failed');
  }
};
```

### DELETE Request
```tsx
const handleDelete = async (id: string) => {
  if (!confirm('Are you sure?')) return;
  try {
    await api.delete(`/features/${id}`);
    toast.success('Deleted');
    setData((prev) => prev.filter((item) => item.id !== id));
  } catch {
    toast.error('Delete failed');
  }
};
```

---

## Toast Notification Patterns

```tsx
import toast from 'react-hot-toast';

// Success (blue icon — Bauhaus style)
toast.success('Product added to cart');

// Error (red icon)
toast.error('Failed to process payment');

// Custom duration
toast.success('Order confirmed!', { duration: 6000 });

// Loading state
const loadingToast = toast.loading('Processing...');
// ... async operation ...
toast.dismiss(loadingToast);
toast.success('Done!');
```

Toast styling is globally configured in `App.tsx`:
- **Font:** `--font-mono`, uppercase, 700 weight
- **Border:** 3px solid `--bauhaus-black`
- **Shadow:** `4px 4px 0px 0px --bauhaus-black`
- **Position:** `top-center`, offset by `--nav-height + 12px`

---

## Routing Patterns

### Link Navigation
```tsx
import { Link, useNavigate } from 'react-router-dom';

// Declarative link
<Link to="/shop" className="btn btn-primary">Shop Now</Link>

// Programmatic navigation
const navigate = useNavigate();
navigate('/checkout');
navigate(`/product/${product.slug}`);
navigate(-1); // Go back
```

### Dynamic Routes
```tsx
import { useParams, useSearchParams } from 'react-router-dom';

// URL params: /product/:slug
const { slug } = useParams();

// Search params: /shop?category=shirts&sort=price
const [searchParams, setSearchParams] = useSearchParams();
const category = searchParams.get('category');
```

---

## Responsive Design Patterns

### Breakpoints
```css
/* Desktop-first approach */
@media (max-width: 1024px) { /* Tablet */ }
@media (max-width: 768px)  { /* Mobile */ }
@media (max-width: 480px)  { /* Small mobile */ }
```

### Mobile Bottom Nav
- On screens ≤768px, `MobileBottomNav` appears with `--safe-bottom: var(--mobile-nav-height)`
- All pages should account for this with `padding-bottom: var(--safe-bottom)`

### CSS Variable Overrides per Breakpoint
```css
@media (max-width: 768px) {
  :root {
    --container-padding: 16px;
    --nav-height: 64px;
    --safe-bottom: var(--mobile-nav-height);
  }
}
```

---

## Component Naming Conventions

| Type | Location | File Naming |
|------|----------|-------------|
| Page component | `pages/PageName/PageName.tsx` | PascalCase folder + file |
| Page CSS | `pages/PageName/PageName.css` | Matching CSS file |
| Reusable component | `components/ComponentName/ComponentName.tsx` | PascalCase folder + file |
| Simple component | `components/ComponentName.tsx` | Single file if no CSS needed |
| Context provider | `context/FeatureContext.tsx` | PascalCase with Context suffix |
| Utility | `lib/utilName.ts` | camelCase |
| Config | `config.ts` | Root-level |

---

## Icon Usage (Lucide React)

```tsx
import { ShoppingCart, Heart, User, Search, X, ChevronRight, Star, Truck } from 'lucide-react';

// Standard usage
<ShoppingCart size={20} />

// With color
<Heart size={18} color="var(--bauhaus-red)" />

// In a button
<button className="btn btn-primary">
  <ShoppingCart size={18} />
  Add to Cart
</button>
```

Browse all icons at: https://lucide.dev/icons

---

## Reference Guides

- **AnimatedPage Component** → [references/animated-page.md](references/animated-page.md)
  Complete source of `pageVariants`, `cinematicStagger`, `cinematicItem` with exact easing curves and timing values. Auto-padding logic (`standard-page-padding` vs `home-page` exemption). Usage patterns for staggered grids.
