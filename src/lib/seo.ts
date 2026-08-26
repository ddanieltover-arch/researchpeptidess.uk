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
import { categoryPath } from './routing';
import { STORE_CONTACT_EMAIL, STORE_WHATSAPP_URL } from './store-contact';
import { isListedShopCategory } from './catalogue-collections';
import { isPublicCatalogueProduct } from './merchandising';

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
    const highestPrice = p.variants?.length
      ? Math.max(...p.variants.map((v) => v.price))
      : lowestPrice;
    const activeVariants = p.variants?.filter((v) => v.status === 'ACTIVE' || v.status === 'LOW_STOCK') || [];
    const inStock = activeVariants.some((v) => (v.stock - (v.reservedStock || 0)) > 0);

    const title = `${p.name} | Research Peptides UK`;
    const description = `${p.shortDescription || p.name} for laboratory research.${p.casNumber ? ` CAS ${p.casNumber}.` : ''} Documentation is shown only where a batch record exists.`;
    const primaryImg = p.images?.find((img) => img.isPrimary)?.url || p.images?.[0]?.url || `${PRIMARY_DOMAIN}/og-image.png`;

    // Only index published products
    const robots = isPublicCatalogueProduct(p)
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
        offers:
          activeVariants.length > 1
            ? {
                '@type': 'AggregateOffer',
                url: canonicalUrl,
                priceCurrency: 'GBP',
                lowPrice: lowestPrice.toFixed(2),
                highPrice: highestPrice.toFixed(2),
                offerCount: activeVariants.length,
                availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              }
            : {
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
            item: context?.category
              ? `${PRIMARY_DOMAIN}${categoryPath(context.category.slug)}`
              : `${PRIMARY_DOMAIN}/shop`,
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

    if (activeVariants.length > 1) {
      jsonLd.unshift({
        '@context': 'https://schema.org',
        '@type': 'ProductGroup',
        name: p.name,
        description: p.longDescription || p.shortDescription,
        url: canonicalUrl,
        productGroupID: p.sku,
        variesBy: ['https://schema.org/size'],
        hasVariant: activeVariants.map((variant) => ({
          '@type': 'Product',
          name: `${p.name} ${variant.size}`,
          sku: variant.sku,
          offers: {
            '@type': 'Offer',
            priceCurrency: 'GBP',
            price: variant.price.toFixed(2),
            availability:
              variant.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          },
        })),
      });
    }

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
    const title = `${c.name} | Research Peptides UK`;
    const description =
      c.seoDescription ||
      `${c.name} for in-vitro laboratory research. Browse published catalogue items in this collection.`;
    const categoryUrl = `${PRIMARY_DOMAIN}${categoryPath(c.slug)}`;

    const hasSearch = Boolean(context?.searchQuery && context.searchQuery.trim().length > 0);

    return {
      title,
      description,
      canonicalUrl: categoryUrl,
      ogTitle: title,
      ogDescription: description,
      ogType: 'website',
      robots: hasSearch ? 'noindex, follow' : 'index, follow',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: c.name,
          description,
          url: categoryUrl,
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: PRIMARY_DOMAIN },
            { '@type': 'ListItem', position: 2, name: c.name, item: categoryUrl },
          ],
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

  // 5. Shop / Search / Category Page
  if (path.startsWith('/shop') || path.startsWith('/search') || path.startsWith('/category/') || path === '/peptides' || path === '/research-chemicals') {
    const hasSearch = Boolean(context?.searchQuery && context.searchQuery.trim().length > 0);
    const pathOnly = path.split('?')[0] || '/shop';
    const canonicalPath = pathOnly.startsWith('/search') ? '/shop' : pathOnly;
    return {
      title: hasSearch
        ? `Search: "${context?.searchQuery}" | Research Peptides UK`
        : pathOnly === '/peptides'
          ? 'Peptides | Research Peptides UK'
          : pathOnly === '/research-chemicals'
            ? 'Research Chemicals | Research Peptides UK'
            : 'Research Peptides Catalogue | Research Peptides UK',
      description:
        'Browse published research peptides and laboratory catalogue items. Documentation is shown only where batch records exist.',
      canonicalUrl: `${PRIMARY_DOMAIN}${canonicalPath}`,
      ogTitle: 'Catalogue | Research Peptides UK',
      ogDescription: 'Research peptides and laboratory reagents for in-vitro use.',
      ogType: 'website',
      robots: hasSearch ? 'noindex, follow' : 'index, follow',
    };
  }

  // 6. Homepage (Default)
  return {
    title: 'Buy Research Peptides UK - 99% Pure British Peptides',
    description:
      'UK laboratory catalogue of research peptides and biochemical reagents for in-vitro use. Documentation is shown only where records exist.',
    canonicalUrl: PRIMARY_DOMAIN,
    ogTitle: 'Buy Research Peptides UK - 99% Pure British Peptides',
    ogDescription:
      'Research peptides and laboratory reagents for in-vitro use, with documentation shown only where records exist.',
    ogType: 'website',
    robots: 'index, follow, max-snippet:-1, max-image-preview:large',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Research Peptides UK',
        url: PRIMARY_DOMAIN,
        logo: `${PRIMARY_DOMAIN}/logo.png`,
        sameAs: [STORE_WHATSAPP_URL],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: STORE_CONTACT_EMAIL,
          url: STORE_WHATSAPP_URL,
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
          target: `${PRIMARY_DOMAIN}/search?q={search_term_string}`,
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
  for (const cat of categories.filter(isListedShopCategory)) {
    urls.push({
      loc: `${PRIMARY_DOMAIN}${categoryPath(cat.slug)}`,
      lastmod: today,
      changefreq: 'weekly',
      priority: '0.8',
    });
  }

  // Published Products (strictly excluding drafts and unlisted)
  for (const p of products.filter(isPublicCatalogueProduct)) {
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
Allow: /peptides
Allow: /research-chemicals
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
