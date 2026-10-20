import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ALL_CATALOGUE_PRODUCTS } from '../src/lib/data/all-products';
import { INITIAL_CATEGORIES } from '../src/lib/data/categories';
import { INITIAL_CMS_PAGES } from '../src/lib/cms-data';
import { INSIGHT_ARTICLES } from '../src/lib/cms-insights-posts';
import { isListedShopCategory } from '../src/lib/catalogue-collections';
import { isPublicCatalogueProduct } from '../src/lib/merchandising';
import { categoryPath, ROUTES } from '../src/lib/routing';
import { PRIMARY_DOMAIN } from '../src/lib/seo';

const today = new Date().toISOString().split('T')[0];
const cmsPages = [...INITIAL_CMS_PAGES, ...INSIGHT_ARTICLES];

type Row = { url: string; lastmod: string; type: string };

const rows: Row[] = [
  { url: PRIMARY_DOMAIN, lastmod: today, type: 'homepage' },
  { url: `${PRIMARY_DOMAIN}/shop`, lastmod: today, type: 'shop' },
  { url: `${PRIMARY_DOMAIN}${ROUTES.peptides}`, lastmod: today, type: 'catalogue' },
  { url: `${PRIMARY_DOMAIN}${ROUTES.researchChemicals}`, lastmod: today, type: 'catalogue' },
];

for (const cat of INITIAL_CATEGORIES.filter(isListedShopCategory)) {
  rows.push({
    url: `${PRIMARY_DOMAIN}${categoryPath(cat.slug)}`,
    lastmod: today,
    type: 'category',
  });
}

for (const p of ALL_CATALOGUE_PRODUCTS.filter(isPublicCatalogueProduct)) {
  rows.push({
    url: `${PRIMARY_DOMAIN}/product/${p.slug}`,
    lastmod: p.updatedAt ? p.updatedAt.split('T')[0] : today,
    type: 'product',
  });
}

for (const cms of cmsPages.filter((c) => c.isPublished && c.category !== 'INSIGHTS')) {
  rows.push({
    url: `${PRIMARY_DOMAIN}/${cms.slug}`,
    lastmod: cms.lastUpdated || today,
    type: 'cms',
  });
}

rows.push({ url: `${PRIMARY_DOMAIN}/insights`, lastmod: today, type: 'insights-index' });

for (const article of cmsPages.filter((c) => c.isPublished && c.category === 'INSIGHTS')) {
  rows.push({
    url: `${PRIMARY_DOMAIN}/insights/${article.slug}`,
    lastmod: article.publishedAt || article.lastUpdated || today,
    type: 'insight',
  });
}

const seen = new Set<string>();
const unique = rows.filter((r) => {
  if (seen.has(r.url)) return false;
  seen.add(r.url);
  return true;
});

const escapeCsv = (value: string) => {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
};

const csv = [
  'url,lastmod,type',
  ...unique.map((r) => [escapeCsv(r.url), r.lastmod, r.type].join(',')),
].join('\n');

const outPath = resolve(process.cwd(), 'urls-for-indexing.csv');
writeFileSync(outPath, `${csv}\n`, 'utf8');
console.log(`Wrote ${unique.length} URLs to ${outPath}`);
