/**
 * Build-time HTML shells for indexable storefront routes (crawler-visible content).
 */

import { CMSPage, Product, ProductCategory } from '../types';
import { isListedShopCategory } from './catalogue-collections';
import { isPublicCatalogueProduct } from './merchandising';
import { categoryPath, parseAppPath } from './routing';
import { getSeoMetadataForPath, HOME_PRERENDER_H1, PRIMARY_DOMAIN, SeoMetadata } from './seo';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function resolvePrerenderSeo(
  path: string,
  products: Product[],
  categories: ProductCategory[],
  cmsPages: CMSPage[]
): SeoMetadata {
  const route = parseAppPath(path);
  const product =
    route.kind === 'product' && route.slug
      ? products.find((p) => p.slug === route.slug)
      : undefined;
  const category =
    route.kind === 'category' && route.slug
      ? categories.find((c) => c.slug === route.slug)
      : product
        ? categories.find((c) => c.id === product.categoryId)
        : undefined;
  const cmsPage =
    route.kind === 'cms' && route.slug ? cmsPages.find((p) => p.slug === route.slug) : undefined;

  return getSeoMetadataForPath(path, { product, category, cmsPage });
}

export function buildPrerenderBody(path: string, seo: SeoMetadata): string {
  const heading = path === '/' ? HOME_PRERENDER_H1 : seo.ogTitle || seo.title;
  const intro = seo.description;
  const shopUrl = `${PRIMARY_DOMAIN}/shop`;

  const resourceLinks =
    path === '/'
      ? `<nav aria-label="Research resources">
  <h2 class="sr-only">Research resources</h2>
  <ul>
    <li><a href="${PRIMARY_DOMAIN}/quality">Quality &amp; HPLC documentation</a></li>
    <li><a href="${PRIMARY_DOMAIN}/shipping">Shipping &amp; delivery</a></li>
    <li><a href="${PRIMARY_DOMAIN}/research-use">Research-use policy</a></li>
    <li><a href="${PRIMARY_DOMAIN}/research">Technical documentation</a></li>
  </ul>
</nav>`
      : '';

  return `<main id="prerender-main">
  <h1>${escapeHtml(heading)}</h1>
  <p>${escapeHtml(intro)}</p>
  <p><a href="${escapeHtml(shopUrl)}">Browse the research catalogue</a></p>
  ${resourceLinks}
</main>`;
}

function upsertMeta(html: string, attr: 'name' | 'property', key: string, content: string): string {
  const escaped = escapeHtml(content);
  const pattern = new RegExp(`<meta\\s+${attr}="${key}"[^>]*>`, 'i');
  const tag = `<meta ${attr}="${key}" content="${escaped}" />`;
  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function upsertLink(html: string, rel: string, href: string): string {
  const escaped = escapeHtml(href);
  const pattern = new RegExp(`<link\\s+rel="${rel}"[^>]*>`, 'i');
  const tag = `<link rel="${rel}" href="${escaped}" />`;
  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

export function applyPrerenderShell(template: string, seo: SeoMetadata, bodyHtml: string): string {
  let html = template;
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`);
  html = upsertMeta(html, 'name', 'description', seo.description);
  html = upsertMeta(html, 'name', 'robots', seo.robots);
  html = upsertMeta(html, 'property', 'og:title', seo.ogTitle);
  html = upsertMeta(html, 'property', 'og:description', seo.ogDescription);
  html = upsertMeta(html, 'property', 'og:type', seo.ogType);
  html = upsertMeta(html, 'property', 'og:url', seo.canonicalUrl);
  if (seo.ogImage) {
    html = upsertMeta(html, 'property', 'og:image', seo.ogImage);
    html = upsertMeta(html, 'name', 'twitter:image', seo.ogImage);
  }
  html = upsertLink(html, 'canonical', seo.canonicalUrl);

  if (seo.jsonLd?.length) {
    const blocks = seo.jsonLd
      .map((row) => `<script type="application/ld+json">${JSON.stringify(row)}</script>`)
      .join('\n    ');
    html = html.replace('</head>', `    ${blocks}\n  </head>`);
  }

  const rootPattern = /<div id="root">\s*<\/div>/i;
  if (rootPattern.test(html)) {
    html = html.replace(rootPattern, `<div id="root">\n    ${bodyHtml}\n  </div>`);
  } else {
    html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, `<div id="root">\n    ${bodyHtml}\n  </div>`);
  }

  return html;
}

export function collectPrerenderPaths(
  products: Product[],
  categories: ProductCategory[],
  cmsPages: CMSPage[]
): string[] {
  const paths = new Set<string>(['/', '/shop', '/peptides', '/research-chemicals']);

  for (const cat of categories.filter(isListedShopCategory)) {
    paths.add(categoryPath(cat.slug));
  }

  for (const product of products.filter(isPublicCatalogueProduct)) {
    paths.add(`/product/${product.slug}`);
  }

  for (const page of cmsPages.filter((p) => p.isPublished)) {
    paths.add(`/${page.slug}`);
  }

  return [...paths].sort();
}
