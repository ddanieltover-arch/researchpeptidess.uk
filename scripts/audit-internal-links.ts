import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { INITIAL_CMS_PAGES } from '../src/lib/cms-data';
import { INITIAL_CATEGORIES } from '../src/lib/data/categories';
import { ALL_CATALOGUE_PRODUCTS } from '../src/lib/data/all-products';
import { SITE_INTERNAL_RESOURCE_LINKS, resourceLinksForPath } from '../src/lib/internal-linking';
import { categoryPath } from '../src/lib/routing';
import { collectPrerenderPaths } from '../src/lib/prerender-html';
import { isPublicCatalogueProduct } from '../src/lib/merchandising';
import { PRIMARY_DOMAIN } from '../src/lib/seo';

const paths = collectPrerenderPaths(ALL_CATALOGUE_PRODUCTS, INITIAL_CATEGORIES, INITIAL_CMS_PAGES);
const rows: Array<{ from: string; to: string; anchor: string; priority: string }> = [];

for (const from of paths) {
  let categoryHref: string | undefined;
  if (from.startsWith('/product/')) {
    const slug = from.replace('/product/', '');
    const product = ALL_CATALOGUE_PRODUCTS.find((p) => p.slug === slug);
    const cat = product ? INITIAL_CATEGORIES.find((c) => c.id === product.categoryId) : undefined;
    categoryHref = cat ? categoryPath(cat.slug) : undefined;
  }
  for (const link of resourceLinksForPath(from, categoryHref)) {
    rows.push({
      from: `${PRIMARY_DOMAIN}${from === '/' ? '' : from}`,
      to: `${PRIMARY_DOMAIN}${link.href === '/' ? '' : link.href}`,
      anchor: link.label,
      priority: link.cluster === 'catalogue' ? 'high' : 'medium',
    });
  }
}

const workspaceDir = resolve(
  process.cwd(),
  'Search Growth Engineering Skill/workspaces/research-peptides-uk/intelligence'
);
const outJson = resolve(workspaceDir, 'internal-linking-plan.json');
const outCsv = resolve(workspaceDir, 'internal_linking_plan.csv');
writeFileSync(
  outJson,
  JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      pillar_links: SITE_INTERNAL_RESOURCE_LINKS.length,
      edge_count: rows.length,
      indexable_paths: paths.length,
      public_products: ALL_CATALOGUE_PRODUCTS.filter(isPublicCatalogueProduct).length,
      rows,
    },
    null,
    2
  ),
  'utf8'
);
const csvEscape = (value: string) => `"${value.replace(/"/g, '""')}"`;
const csvLines = ['from_url,to_url,anchor_text,priority', ...rows.map((r) =>
  [csvEscape(r.from), csvEscape(r.to), csvEscape(r.anchor), csvEscape(r.priority)].join(',')
)];
writeFileSync(outCsv, csvLines.join('\n'), 'utf8');
console.log(`Wrote ${rows.length} internal link edges to ${outJson} and ${outCsv}`);
