import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
  noIndex?: boolean;
}

/**
 * SEOHead — Manages document head for SEO, AEO, GEO, SXO, AIO
 * 
 * - SEO: title, meta description, keywords, canonical
 * - AEO: JSON-LD structured data for answer engines (FAQ, Product, etc.)
 * - GEO: Organization/Brand entity markup for generative AI
 * - SXO: Open Graph + Twitter Card for social sharing
 * - AIO: Machine-readable schema.org structured data
 */
export default function SEOHead({
  title,
  description,
  keywords,
  canonical,
  ogImage = '/assets/og-default.jpg',
  ogType = 'website',
  jsonLd,
  noIndex = false,
}: SEOHeadProps) {
  useEffect(() => {
    // --- Title ---
    document.title = title;

    // --- Helper: set or create meta tag ---
    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // --- Standard SEO Meta ---
    setMeta('name', 'description', description);
    if (keywords) setMeta('name', 'keywords', keywords);
    if (noIndex) setMeta('name', 'robots', 'noindex, nofollow');

    // --- Canonical URL ---
    const canonicalUrl = canonical || window.location.origin + window.location.pathname;
    let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', canonicalUrl);

    // --- Open Graph (SXO) ---
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', ogType);
    setMeta('property', 'og:url', canonicalUrl);
    if (ogImage) setMeta('property', 'og:image', ogImage.startsWith('http') ? ogImage : window.location.origin + ogImage);
    setMeta('property', 'og:site_name', 'FANCLUB');
    setMeta('property', 'og:locale', 'en_IN');

    // --- Twitter Card (SXO) ---
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    if (ogImage) setMeta('name', 'twitter:image', ogImage.startsWith('http') ? ogImage : window.location.origin + ogImage);

    // --- JSON-LD Structured Data (AEO / GEO / AIO) ---
    // Remove any previous JSON-LD injected by this component
    document.querySelectorAll('script[data-seo-head="true"]').forEach(el => el.remove());

    const schemas = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

    // Always inject base Organization schema (GEO — brand entity for generative AI)
    const baseOrg = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'FANCLUB',
      url: window.location.origin,
      logo: window.location.origin + '/favicon.svg',
      description: 'Fandom-inspired streetwear celebrating Telugu Film Industry culture. Premium t-shirts, hoodies, and accessories.',
      sameAs: [
        'https://instagram.com/fanclub',
        'https://youtube.com/@fanclub',
        'https://twitter.com/fanclub',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: ['English', 'Telugu', 'Hindi'],
      },
    };

    // Always inject WebSite schema with SearchAction (AEO — sitelinks search)
    const webSiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'FANCLUB',
      url: window.location.origin,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${window.location.origin}/shop?search={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    };

    const allSchemas = [baseOrg, webSiteSchema, ...schemas];

    allSchemas.forEach(schema => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-head', 'true');
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    // Cleanup on unmount
    return () => {
      document.querySelectorAll('script[data-seo-head="true"]').forEach(el => el.remove());
    };
  }, [title, description, keywords, canonical, ogImage, ogType, jsonLd, noIndex]);

  return null; // This component only manages <head>, no visible output
}

/* ─── JSON-LD Schema Helpers ─── */

/** Product schema for Product Detail pages (AIO / AEO) */
export function buildProductSchema(product: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.id,
    brand: { '@type': 'Brand', name: 'FANCLUB' },
    category: product.category?.name,
    offers: {
      '@type': 'Offer',
      url: `${window.location.origin}/product/${product.slug}`,
      priceCurrency: 'INR',
      price: product.price,
      ...(product.comparePrice && { priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }),
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'FANCLUB' },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: product.price >= 999 ? '0' : '99',
          currency: 'INR',
        },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 3, maxValue: 7, unitCode: 'DAY' },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'IN',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail',
      },
    },
    ...(product.reviewCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    ...(product.reviews?.length > 0 && {
      review: product.reviews.slice(0, 5).map((r: any) => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: r.user?.name || 'FAN Customer' },
        reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
        reviewBody: r.comment || '',
        datePublished: r.createdAt,
      })),
    }),
  };
}

/** FAQ schema for FAQ page (AEO — critical for voice/answer search) */
export function buildFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/** BreadcrumbList schema for navigation (SXO / SEO) */
export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** CollectionPage schema for Shop page (AIO) */
export function buildCollectionSchema(title: string, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description: description,
    isPartOf: { '@type': 'WebSite', name: 'FANCLUB', url: window.location.origin },
  };
}
