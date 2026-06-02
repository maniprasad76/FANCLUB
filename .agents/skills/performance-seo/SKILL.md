---
name: performance-seo
description: "Performance optimization and SEO for TFI Club. ACTIVATE when: running Lighthouse audits, optimizing bundle size, adding meta tags, implementing structured data, fixing Core Web Vitals, lazy loading images/routes, optimizing CSS/JS delivery, adding Open Graph tags, creating sitemaps, debugging slow page loads, analyzing network requests, or checking accessibility. Triggers: Lighthouse, performance, SEO, meta tags, Core Web Vitals, bundle, lazy load, Open Graph, structured data, sitemap, accessibility, LCP, CLS, FID, TTFB."
metadata:
  author: tfi-team
  version: "1.0.0"
---

# Performance & SEO — TFI Club

## Lighthouse Audit Automation

Use the Chrome DevTools MCP server to run automated Lighthouse audits:

```
chrome-devtools-mcp → lighthouse_audit
```

### Running an Audit
1. Navigate to the page: `navigate_page` → `http://localhost:5173`
2. Run audit: `lighthouse_audit` with categories `["performance", "seo", "accessibility", "best-practices"]`
3. Analyze results and fix issues

### Target Scores
| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Performance | 90+ | ≥ 70 |
| SEO | 95+ | ≥ 85 |
| Accessibility | 90+ | ≥ 80 |
| Best Practices | 90+ | ≥ 80 |

---

## Core Web Vitals

### LCP (Largest Contentful Paint) — Target: < 2.5s
| Issue | Fix |
|-------|-----|
| Large hero images | Use WebP/AVIF, `loading="eager"` for hero, Supabase image transforms |
| Render-blocking CSS | Inline critical CSS, load non-critical async |
| Slow server response | Enable Cloud Run min-instances for zero cold starts |
| Large bundle | Code split with React.lazy + Suspense |

### CLS (Cumulative Layout Shift) — Target: < 0.1
| Issue | Fix |
|-------|-----|
| Images without dimensions | Always set `width` and `height` attributes |
| Fonts causing layout shift | Use `font-display: swap` + preload key fonts |
| Dynamic content injection | Reserve space for lazy-loaded content with skeletons |
| Ads/embeds resizing | Set fixed container dimensions |

### INP (Interaction to Next Paint) — Target: < 200ms
| Issue | Fix |
|-------|-----|
| Heavy click handlers | Debounce search inputs, throttle scroll handlers |
| Synchronous renders | Use `useDeferredValue` or `useTransition` for non-urgent updates |
| Large DOM | Virtualize long product lists with `react-window` |

---

## Vite Bundle Optimization

### Analyze Bundle Size
```bash
cd frontend
npx vite-bundle-visualizer
```

### Code Splitting with Lazy Routes
```tsx
import { lazy, Suspense } from 'react';

// Lazy load heavy pages
const Shop = lazy(() => import('./pages/Shop/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail/ProductDetail'));
const Cinema = lazy(() => import('./pages/Cinema/Cinema'));
const Profile = lazy(() => import('./pages/Profile/Profile'));
const Checkout = lazy(() => import('./pages/Checkout/Checkout'));

// In routes:
<Suspense fallback={<PageSkeleton />}>
  <Route path="/shop" element={<Shop />} />
</Suspense>
```

### Vite Config Optimizations
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  build: {
    // Manual chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          animations: ['framer-motion'],
          supabase: ['@supabase/supabase-js'],
          icons: ['lucide-react'],
        },
      },
    },
    // Enable source maps for debugging in production (optional)
    sourcemap: false,
    // CSS code split
    cssCodeSplit: true,
    // Target modern browsers
    target: 'es2020',
  },
});
```

### Tree Shaking Verification
```bash
# Check if tree shaking is working for icon library:
# Bad: import * as Icons from 'lucide-react'  ← imports ALL icons
# Good: import { ShoppingCart, Heart } from 'lucide-react'  ← only imports used icons
```

---

## SEO Implementation

### SEOHead Component (Actual Implementation)

The project has a 244-line `components/SEOHead.tsx` that does far more than basic meta tags.
Every call to `<SEOHead>` auto-injects **Organization** + **WebSite** schemas on every page.

```tsx
import SEOHead, { buildProductSchema, buildFAQSchema, buildBreadcrumbSchema, buildCollectionSchema } from '../../components/SEOHead';

// Product page:
<SEOHead
  title={`${product.name} - TFICLUB`}
  description={product.description.substring(0, 160)}
  ogImage={product.images[0]}
  ogType="product"
  jsonLd={buildProductSchema(product)}
/>

// Category page with breadcrumbs:
<SEOHead
  title="T-Shirts - TFICLUB"
  description="Cinema-inspired streetwear tees"
  jsonLd={[
    buildBreadcrumbSchema([
      { name: 'Home', url: 'https://tficlub.com/' },
      { name: 'Shop', url: 'https://tficlub.com/shop' },
      { name: 'T-Shirts', url: 'https://tficlub.com/shop?category=t-shirts' },
    ]),
    buildCollectionSchema('T-Shirts', 'Cinema-inspired t-shirts'),
  ]}
/>

// FAQ page:
<SEOHead
  title="FAQ - TFICLUB"
  description="Frequently asked questions"
  jsonLd={buildFAQSchema(faqs)}
/>
```

> **NOTE:** `buildProductSchema` auto-generates shipping details (free over ₹999), return policy (7-day), aggregate ratings, and individual reviews — no manual schema writing needed.

### Product Page Structured Data (JSON-LD)
```tsx
// Add to ProductDetail page:
<script type="application/ld+json">
{JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Product",
  "name": product.name,
  "image": product.images,
  "description": product.description,
  "brand": {
    "@type": "Brand",
    "name": "TFI Club"
  },
  "offers": {
    "@type": "Offer",
    "price": product.price,
    "priceCurrency": "INR",
    "availability": product.stock > 0
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
    "url": `https://tficlub.com/product/${product.slug}`
  },
  "aggregateRating": product.reviewCount > 0 ? {
    "@type": "AggregateRating",
    "ratingValue": product.rating,
    "reviewCount": product.reviewCount
  } : undefined
})}
</script>
```

### Open Graph Tags Checklist
```html
<!-- Required for social sharing -->
<meta property="og:title" content="Product Name - TFI Club" />
<meta property="og:description" content="Product description..." />
<meta property="og:image" content="https://supabase-url/product-image.jpg" />
<meta property="og:url" content="https://tficlub.com/product/slug" />
<meta property="og:type" content="product" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Product Name - TFI Club" />
<meta name="twitter:description" content="Product description..." />
<meta name="twitter:image" content="https://supabase-url/product-image.jpg" />
```

### Sitemap Generation
Create a static sitemap or generate dynamically:

```xml
<!-- public/sitemap.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://tficlub.com/</loc><priority>1.0</priority></url>
  <url><loc>https://tficlub.com/shop</loc><priority>0.9</priority></url>
  <url><loc>https://tficlub.com/about</loc><priority>0.7</priority></url>
  <url><loc>https://tficlub.com/contact</loc><priority>0.6</priority></url>
  <url><loc>https://tficlub.com/faq</loc><priority>0.5</priority></url>
  <!-- Dynamic product pages generated by backend -->
</urlset>
```

### Robots.txt
```txt
# public/robots.txt
User-agent: *
Allow: /
Disallow: /profile
Disallow: /checkout
Disallow: /cart
Disallow: /login
Disallow: /register
Sitemap: https://tficlub.com/sitemap.xml
```

---

## Image Optimization

### Supabase Storage Image Transforms
```typescript
// Original image URL:
const originalUrl = `${SUPABASE_URL}/storage/v1/object/public/products/${imagePath}`;

// Transformed (resized) URL:
const thumbnailUrl = `${SUPABASE_URL}/storage/v1/render/image/public/products/${imagePath}?width=400&height=400&resize=contain`;
const heroUrl = `${SUPABASE_URL}/storage/v1/render/image/public/products/${imagePath}?width=1200&quality=80`;
```

### Lazy Loading Images
```tsx
// Native lazy loading (recommended for below-the-fold images)
<img
  src={product.images[0]}
  alt={product.name}
  loading="lazy"
  width={400}
  height={400}
  decoding="async"
/>

// Hero/above-the-fold images should NOT be lazy loaded
<img
  src={heroImage}
  alt="Hero banner"
  loading="eager"
  fetchPriority="high"
  width={1200}
  height={600}
/>
```

### Image Size Guidelines
| Context | Max Width | Quality | Format |
|---------|----------|---------|--------|
| Product thumbnail | 400px | 80% | WebP |
| Product gallery | 800px | 85% | WebP |
| Hero banner | 1200px | 80% | WebP |
| Category image | 600px | 80% | WebP |
| Avatar | 200px | 75% | WebP |

---

## CSS Performance

### Critical CSS
The Bauhaus design system variables and reset styles in `index.css` are critical — they load synchronously. Page-specific CSS files load with their component chunks.

### Font Loading Strategy
Fonts are loaded via `<link>` in `index.html` for optimal performance:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&family=Outfit:wght@500;600;700&family=Playfair+Display:ital,wght@1,400;1,500&family=Space+Grotesk:wght@700;800;900&display=swap" rel="stylesheet">
```

- `font-display: swap` prevents invisible text during font loading
- `preconnect` reduces DNS/TLS latency for Google Fonts

### CSS Optimization Checklist
- [ ] No unused CSS classes (run PurgeCSS or check manually)
- [ ] CSS variables used consistently (no hardcoded hex colors)
- [ ] Media queries use mobile-first or desktop-first consistently (TFI uses desktop-first)
- [ ] `will-change` only on animated elements (`.cinematic-layer`)
- [ ] No layout thrashing (batch DOM reads before DOM writes)

---

## Network Performance

### Chrome DevTools Network Analysis
```
chrome-devtools-mcp → list_network_requests    # See all network calls
chrome-devtools-mcp → get_network_request      # Inspect specific request
chrome-devtools-mcp → performance_start_trace  # Start performance trace
chrome-devtools-mcp → performance_stop_trace   # Stop and analyze
chrome-devtools-mcp → performance_analyze_insight  # Get insights
```

### API Response Optimization
```typescript
// Backend: Use select to return only needed fields
const products = await this.prisma.product.findMany({
  select: {
    id: true,
    name: true,
    slug: true,
    price: true,
    comparePrice: true,
    images: true, // Only first image needed for listing
    rating: true,
    reviewCount: true,
    isActive: true,
  },
});

// Don't return: description, tags, colors, sizes (heavy fields not needed in listing)
```

### Caching Strategy
```typescript
// Backend: Add Cache-Control headers for static-ish data
@Get('categories')
@Header('Cache-Control', 'public, max-age=300, s-maxage=600')
findAll() {
  return this.categoriesService.findAll();
}
```

---

## Memory Leak Detection

```
chrome-devtools-mcp → take_heapsnapshot
```

### Common React Memory Leaks
1. **Uncleared intervals/timeouts** — Always clear in useEffect cleanup
2. **Event listeners not removed** — Use cleanup in useEffect
3. **Axios requests after unmount** — Use AbortController
4. **Supabase auth listener** — Unsubscribe in cleanup (already done in AuthContext)

```tsx
// Pattern: Cleanup async operations
useEffect(() => {
  const controller = new AbortController();

  api.get('/products', { signal: controller.signal })
    .then(res => setData(res.data))
    .catch(err => {
      if (err.name !== 'AbortError') toast.error('Failed to load');
    });

  return () => controller.abort();
}, []);
```

---

## Performance Monitoring Checklist

- [ ] Lighthouse score ≥ 90 for all categories
- [ ] LCP < 2.5 seconds
- [ ] CLS < 0.1
- [ ] INP < 200ms
- [ ] Total bundle size < 500KB (gzipped)
- [ ] No render-blocking resources
- [ ] Images lazy loaded (below-the-fold)
- [ ] Fonts preloaded with `font-display: swap`
- [ ] API responses under 200ms for listing endpoints
- [ ] No memory leaks on route navigation

---

## Reference Guides

- **SEOHead Component API** → [references/seo-head-component.md](references/seo-head-component.md)
  Complete props interface, all 4 schema builder functions (`buildProductSchema`, `buildFAQSchema`, `buildBreadcrumbSchema`, `buildCollectionSchema`), auto-injected Organization schema, and usage examples.
