/**
 * Research Peptides UK — Production SEO & Structured Data Architecture
 *
 * Implements:
 * 1. Canonical URL governance (strictly https://researchpeptidess.uk)
 * 2. Dynamic OpenGraph / Twitter Cards
 * 3. Schema.org JSON-LD Structured Data (Organization, WebSite, Breadcrumbs, Product, Offer)
 * 4. Dynamic XML Sitemap generator (excludes drafts, admin, checkout, cart, private pages)
 * 5. Production robots.txt rules
 * 6. Search query indexing protection
 */

import { Product, ProductCategory, CMSPage } from '../types';

export const PRIMARY_DOMAIN = 'https://researchpeptidess.uk';

export interface SeoMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogType: 'website' | 'article' | 'product';
  ogImage?: string;
  robots: string;
  jsonLd?: Record<string, unknown>[];
}

/**
 * Builds canonical URL for a given path, stripping out query parameter loops
 */
export function buildCanonicalUrl(path: string): string {
  // Strip out any query strings or tracking parameters from canonical URL
  const cleanPath = path.split('?')[0].split('#')[0];
  const normalized = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  return `${PRIMARY_DOMAIN}${normalized === '/' ? '' : normalized}`;
}

/**
 * Generates SEO metadata for any storefront path
 */
export function getSeoMetadataForPath(
  path: string,
  context?: {
    product?: Product | null;
    category?: ProductCategory | null;
    cmsPage?: CMSPage | null;
    searchQuery?: string;
  }
): SeoMetadata {
  const canonicalUrl = buildCanonicalUrl(path);

  // 1. Product Detail Page
  if (context?.product) {
    const p = context.product;
    const lowestPrice = p.variants?.length
      ? Math.min(...p.variants.map((v) => v.price))
      : 0;
    const activeVariants = p.variants?.filter((v) => v.status === 'ACTIVE') || [];
    const inStock = activeVariants.some((v) => (v.stock - (v.reservedStock || 0)) > 0);

    const title = `${p.name} (${p.shortDescription || 'In-Vitro Reference'}) | Research Peptides UK`;
    const description = `Buy ${p.name} for laboratory research. CAS: ${p.casNumber || 'N/A'}. HPLC tested reference standard with batch documentation.`;
    const primaryImg = p.images?.find((img) => img.isPrimary)?.url || p.images?.[0]?.url || `${PRIMARY_DOMAIN}/og-image.png`;

    // Only index published products
    const robots = p.status === 'PUBLISHED' && p.visibility === 'PUBLIC'
      ? 'index, follow, max-image-preview:large'
      : 'noindex, nofollow';

    // JSON-LD for Product (strictly factual: NO fake ratings, NO invented reviews)
    const jsonLd: Record<string, unknown>[] = [
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: p.name,
        description: p.longDescription || p.shortDescription,
        image: primaryImg,
        sku: p.sku,
        mpn: p.casNumber || p.sku,
        brand: {
          '@type': 'Brand',
          name: 'Research Peptides UK',
        },
        category: p.categoryName || 'Biochemical Reagents',
        offers: {
          '@type': 'Offer',
          url: canonicalUrl,
          priceCurrency: 'GBP',
          price: lowestPrice.toFixed(2),
          availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
          seller: {
            '@type': 'Organization',
            name: 'Research Peptides UK',
          },
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: PRIMARY_DOMAIN,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: p.categoryName || 'Catalogue',
            item: `${PRIMARY_DOMAIN}/shop`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: p.name,
            item: canonicalUrl,
          },
        ],
      },
    ];

    return {
      title,
      description,
      canonicalUrl,
      ogTitle: title,
      ogDescription: description,
      ogType: 'product',
      ogImage: primaryImg,
      robots,
      jsonLd,
    };
  }

  // 2. Category / Shop Page
  if (context?.category) {
    const c = context.category;
    const title = `${c.name} | Laboratory Research Peptides UK`;
    const description = c.seoDescription || `Explore high-purity ${c.name.toLowerCase()} for in-vitro research and biochemical assays. Verified batch HPLC standards with cold-chain UK dispatch.`;

    return {
      title,
      description,
      canonicalUrl: `${PRIMARY_DOMAIN}/shop?category=${c.slug}`,
      ogTitle: title,
      ogDescription: description,
      ogType: 'website',
      robots: 'index, follow',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: c.name,
          description,
          url: `${PRIMARY_DOMAIN}/shop?category=${c.slug}`,
        },
      ],
    };
  }

  // 3. CMS Pages
  if (context?.cmsPage) {
    const cms = context.cmsPage;
    return {
      title: `${cms.title} | Research Peptides UK`,
      description: cms.seoDescription,
      canonicalUrl,
      ogTitle: `${cms.title} | Research Peptides UK`,
      ogDescription: cms.seoDescription,
      ogType: 'article',
      robots: cms.isPublished ? 'index, follow' : 'noindex, nofollow',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: cms.title,
          description: cms.seoDescription,
          url: canonicalUrl,
        },
      ],
    };
  }

  // 4. Private / Non-Indexable Routes
  const privateRoutes = ['/admin', '/cart', '/checkout', '/account', '/payment-verification'];
  if (privateRoutes.some((route) => path.startsWith(route))) {
    return {
      title: 'Research Peptides UK — Laboratory Portal',
      description: 'Authorized laboratory customer and administrative portal.',
      canonicalUrl,
      ogTitle: 'Research Peptides UK',
      ogDescription: 'Laboratory portal',
      ogType: 'website',
      robots: 'noindex, nofollow, noarchive',
    };
  }

  // 5. Shop / Search Page
  if (path.startsWith('/shop')) {
    const hasSearch = Boolean(context?.searchQuery && context.searchQuery.trim().length > 0);
    return {
      title: hasSearch
        ? `Search: "${context?.searchQuery}" | Research Peptides UK`
        : 'Buy In-Vitro Research Peptides | Verified Laboratory Standards UK',
      description:
        'Browse high-purity analytical peptide reference standards. Certified HPLC and Mass Spectrometry documentation for academic and institutional research in the UK and Europe.',
      canonicalUrl: `${PRIMARY_DOMAIN}/shop`,
      ogTitle: 'Catalogue | Research Peptides UK',
      ogDescription: 'High-purity in-vitro research peptides and analytical biochemical standards.',
      ogType: 'website',
      robots: hasSearch ? 'noindex, follow' : 'index, follow', // Do not index arbitrary search queries
    };
  }

  // 6. Homepage (Default)
  return {
    title: 'Research Peptides UK | High-Purity In-Vitro Biochemicals & Analytical Standards',
    description:
      'Dedicated British supplier of high-purity in-vitro research peptides, reference standards, and analytical reagents. HPLC-verified batch documentation and cold-chain UK dispatch.',
    canonicalUrl: PRIMARY_DOMAIN,
    ogTitle: 'Research Peptides UK | Analytical & In-Vitro Research Compounds',
    ogDescription:
      'High-purity synthetic peptides with HPLC and MS batch documentation for scientific laboratories in the UK & Europe.',
    ogType: 'website',
    robots: 'index, follow, max-snippet:-1, max-image-preview:large',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Research Peptides UK',
        url: PRIMARY_DOMAIN,
        logo: `${PRIMARY_DOMAIN}/logo.png`,
        sameAs: [],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: 'lab@researchpeptidess.uk',
          availableLanguage: 'English',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Research Peptides UK',
        url: PRIMARY_DOMAIN,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${PRIMARY_DOMAIN}/shop?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
}

/**
 * Generates an XML Sitemap dynamically based on published items
 */
export function generateXmlSitemap(
  products: Product[],
  categories: ProductCategory[],
  cmsPages: CMSPage[]
): string {
  const urls: { loc: string; lastmod: string; changefreq: string; priority: string }[] = [];
  const today = new Date().toISOString().split('T')[0];

  // Homepage
  urls.push({
    loc: PRIMARY_DOMAIN,
    lastmod: today,
    changefreq: 'daily',
    priority: '1.0',
  });

  // Shop Catalogue
  urls.push({
    loc: `${PRIMARY_DOMAIN}/shop`,
    lastmod: today,
    changefreq: 'daily',
    priority: '0.9',
  });

  // Published Categories
  for (const cat of categories.filter((c) => c.isActive)) {
    urls.push({
      loc: `${PRIMARY_DOMAIN}/shop?category=${cat.slug}`,
      lastmod: today,
      changefreq: 'weekly',
      priority: '0.8',
    });
  }

  // Published Products (strictly excluding drafts and unlisted)
  for (const p of products.filter((p) => p.status === 'PUBLISHED' && p.visibility === 'PUBLIC')) {
    urls.push({
      loc: `${PRIMARY_DOMAIN}/product/${p.slug}`,
      lastmod: p.updatedAt ? p.updatedAt.split('T')[0] : today,
      changefreq: 'weekly',
      priority: '0.8',
    });
  }

  // Published Informational / CMS Pages
  for (const cms of cmsPages.filter((c) => c.isPublished)) {
    urls.push({
      loc: `${PRIMARY_DOMAIN}/${cms.slug}`,
      lastmod: cms.lastUpdated || today,
      changefreq: 'monthly',
      priority: '0.6',
    });
  }

  const xmlEntries = urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;
}

/**
 * Generates production robots.txt content
 */
export function generateRobotsTxt(): string {
  return `# Research Peptides UK — Production Robots Configuration
User-agent: *
Allow: /
Allow: /shop
Allow: /product/
Allow: /about
Allow: /research
Allow: /quality
Allow: /faq
Allow: /contact
Allow: /shipping
Allow: /returns
Allow: /terms
Allow: /privacy
Allow: /cookies
Allow: /research-use

# Disallow indexing of administrative, private and transactional paths
Disallow: /admin
Disallow: /admin/*
Disallow: /account
Disallow: /account/*
Disallow: /cart
Disallow: /checkout
Disallow: /checkout/*
Disallow: /payment-verification/*
Disallow: /api/*

# Sitemap Location
Sitemap: ${PRIMARY_DOMAIN}/sitemap.xml
`;
}
