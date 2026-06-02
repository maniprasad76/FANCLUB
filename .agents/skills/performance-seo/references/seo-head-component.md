# SEOHead Component Reference

> Extracted from `frontend/src/components/SEOHead.tsx` (244 lines)

## Component Props

```typescript
interface SEOHeadProps {
  title: string;             // Page <title>
  description: string;       // meta description
  keywords?: string;         // meta keywords
  canonical?: string;        // canonical URL (auto-generates from current URL if omitted)
  ogImage?: string;          // Open Graph image (default: '/assets/og-default.jpg')
  ogType?: string;           // og:type (default: 'website')
  jsonLd?: Record<string, any> | Record<string, any>[];  // JSON-LD schemas
  noIndex?: boolean;         // Set noindex, nofollow (default: false)
}
```

## What It Auto-Generates

Every page using `<SEOHead>` automatically gets:

1. **Title tag** — `document.title = title`
2. **Meta description** — `<meta name="description">`
3. **Keywords** (if provided) — `<meta name="keywords">`
4. **Canonical URL** — `<link rel="canonical">`
5. **Open Graph tags** — og:title, og:description, og:type, og:url, og:image, og:site_name, og:locale
6. **Twitter Card tags** — card, title, description, image
7. **Organization schema** (always) — brand entity with social links
8. **WebSite schema** (always) — with SearchAction for sitelinks search box
9. **Custom JSON-LD** (if provided) — additional schemas passed via `jsonLd` prop

## Built-in Schema Helpers

### Product Schema
```typescript
import { buildProductSchema } from '../components/SEOHead';

// Usage on ProductDetail page:
<SEOHead
  title={`${product.name} - TFICLUB`}
  description={product.description.substring(0, 160)}
  ogImage={product.images[0]}
  ogType="product"
  jsonLd={buildProductSchema(product)}
/>
```

The `buildProductSchema` generates rich Product markup including:
- Brand (TFICLUB)
- Price + currency (INR)
- Availability (InStock/OutOfStock based on `stock`)
- Shipping details (free over ₹999, else ₹99)
- Return policy (7-day returns, by mail)
- Aggregate rating (if `reviewCount > 0`)
- Individual reviews (up to 5)

### FAQ Schema
```typescript
import { buildFAQSchema } from '../components/SEOHead';

<SEOHead
  title="FAQ - TFICLUB"
  description="Frequently asked questions about TFICLUB orders, shipping, and returns."
  jsonLd={buildFAQSchema([
    { question: 'What is TFI Club?', answer: '...' },
    { question: 'How do returns work?', answer: '...' },
  ])}
/>
```

### Breadcrumb Schema
```typescript
import { buildBreadcrumbSchema } from '../components/SEOHead';

<SEOHead
  title="T-Shirts - TFICLUB"
  description="..."
  jsonLd={[
    buildBreadcrumbSchema([
      { name: 'Home', url: 'https://tficlub.com/' },
      { name: 'Shop', url: 'https://tficlub.com/shop' },
      { name: 'T-Shirts', url: 'https://tficlub.com/shop?category=t-shirts' },
    ]),
    buildCollectionSchema('T-Shirts', 'Cinema-inspired t-shirts'),
  ]}
/>
```

### Collection Schema
```typescript
import { buildCollectionSchema } from '../components/SEOHead';

// For category/shop listing pages:
<SEOHead
  title="Shop All - TFICLUB"
  description="..."
  jsonLd={buildCollectionSchema('Shop All', 'Browse our full collection...')}
/>
```

## Organization Schema (Auto-injected)

Every page automatically includes this brand entity schema:
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "TFICLUB",
  "description": "Cinema-inspired streetwear celebrating Telugu Film Industry culture. Premium t-shirts, hoodies, and accessories.",
  "sameAs": [
    "https://instagram.com/tficlub",
    "https://youtube.com/@tficlub",
    "https://twitter.com/tficlub",
    "https://pinterest.com/tficlub"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "availableLanguage": ["English", "Telugu", "Hindi"]
  }
}
```
