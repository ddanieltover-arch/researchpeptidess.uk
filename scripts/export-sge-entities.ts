import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { INITIAL_CMS_PAGES } from '../src/lib/cms-data';
import { ALL_CATALOGUE_PRODUCTS } from '../src/lib/data/all-products';
import { isPublicCatalogueProduct } from '../src/lib/merchandising';
import {
  getSeoMetadataForPath,
  HOME_PAGE_TITLE,
  PRIMARY_DOMAIN,
} from '../src/lib/seo';

const records: Record<string, unknown>[] = [
  {
    '@type': 'Organization',
    name: 'Research Peptides UK',
    url: PRIMARY_DOMAIN,
    source: 'seo.ts',
  },
  {
    '@type': 'WebSite',
    name: 'Research Peptides UK',
    url: PRIMARY_DOMAIN,
    source: 'seo.ts',
  },
];

for (const page of INITIAL_CMS_PAGES.filter((p) => p.isPublished)) {
  records.push({
    '@type': 'WebPage',
    name: page.title,
    url: `${PRIMARY_DOMAIN}/${page.slug}`,
    source: 'cms-data.ts',
  });
}

for (const product of ALL_CATALOGUE_PRODUCTS.filter(isPublicCatalogueProduct).slice(0, 25)) {
  const seo = getSeoMetadataForPath(`/product/${product.slug}`, { product });
  const productLd = (seo.jsonLd || []).find((row) => row['@type'] === 'Product');
  if (productLd) {
    records.push({ ...productLd, source: `product:${product.slug}` });
  }
}

const homeSeo = getSeoMetadataForPath('/');
records.push({
  '@type': 'WebPage',
  name: HOME_PAGE_TITLE,
  url: PRIMARY_DOMAIN,
  source: 'homepage',
  jsonLd: homeSeo.jsonLd,
});

const out = resolve(
  process.cwd(),
  'Search Growth Engineering Skill/workspaces/research-peptides-uk/intelligence/entity-records.json'
);
writeFileSync(out, JSON.stringify({ records, exported_at: new Date().toISOString() }, null, 2));
console.log(`Wrote ${records.length} entity records to ${out}`);
