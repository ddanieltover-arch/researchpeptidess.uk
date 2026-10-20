import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { INITIAL_CMS_PAGES } from '../src/lib/cms-data';
import { INSIGHT_ARTICLES } from '../src/lib/cms-insights-posts';
import { INITIAL_CATEGORIES } from '../src/lib/data/categories';
import { ALL_CATALOGUE_PRODUCTS } from '../src/lib/data/all-products';
import { PEPTIDES_DEMAND_FEATURED_SLUGS } from '../src/lib/featured-catalogue';
import { SITE_INTERNAL_RESOURCE_LINKS, resourceLinksForPath } from '../src/lib/internal-linking';
import { PRODUCT_TO_INSIGHT_SLUG } from '../src/lib/insight-product-links';
import { categoryPath, insightPath } from '../src/lib/routing';
import { collectPrerenderPaths } from '../src/lib/prerender-html';
import { isPublicCatalogueProduct } from '../src/lib/merchandising';
import { PRIMARY_DOMAIN } from '../src/lib/seo';
import { SLUG_REDIRECTS } from '../src/lib/data/generated/slug-redirects';

const cmsForPrerender = [...INITIAL_CMS_PAGES, ...INSIGHT_ARTICLES];
const paths = collectPrerenderPaths(ALL_CATALOGUE_PRODUCTS, INITIAL_CATEGORIES, cmsForPrerender);
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

const publishedSlugs = new Set(ALL_CATALOGUE_PRODUCTS.filter(isPublicCatalogueProduct).map((p) => p.slug));

type Gap = { id: string; severity: string; detail: string; fix: string };
const gaps: Gap[] = [];

for (const slug of PEPTIDES_DEMAND_FEATURED_SLUGS) {
  if (!publishedSlugs.has(slug)) {
    gaps.push({
      id: `featured-missing-${slug}`,
      severity: 'high',
      detail: `Featured /peptides slug "${slug}" does not resolve to a published product.`,
      fix: 'Update PEPTIDES_DEMAND_FEATURED_SLUGS to a live canonical slug.',
    });
  }
}

const insightMarkdown = INSIGHT_ARTICLES.map((a) => a.contentMarkdown).join('\n');
const productLinkRe = /\]\(\/product\/([a-z0-9-]+)\)/gi;
let match: RegExpExecArray | null;
const linkedProductSlugs = new Set<string>();
while ((match = productLinkRe.exec(insightMarkdown))) {
  linkedProductSlugs.add(match[1]);
}
for (const slug of linkedProductSlugs) {
  const canonical = SLUG_REDIRECTS[slug] ?? slug;
  if (!publishedSlugs.has(canonical) && !publishedSlugs.has(slug)) {
    gaps.push({
      id: `insight-link-orphan-${slug}`,
      severity: 'high',
      detail: `Lab Insights markdown links to /product/${slug} but no published SKU matches (redirect target: ${canonical}).`,
      fix: 'Point markdown to canonical PDP slug.',
    });
  } else if (SLUG_REDIRECTS[slug] && slug !== canonical) {
    gaps.push({
      id: `insight-link-redirect-${slug}`,
      severity: 'medium',
      detail: `Insights link uses legacy slug /product/${slug} → redirects to ${canonical}.`,
      fix: 'Use canonical slug in markdown for cleaner internal graph.',
    });
  }
}

for (const [productSlug, insightSlug] of Object.entries(PRODUCT_TO_INSIGHT_SLUG)) {
  if (!publishedSlugs.has(productSlug)) {
    gaps.push({
      id: `pdp-insight-map-missing-product-${productSlug}`,
      severity: 'low',
      detail: `PRODUCT_TO_INSIGHT_SLUG maps unpublished product "${productSlug}".`,
      fix: 'Remove or update mapping when catalogue changes.',
    });
  }
  const article = INSIGHT_ARTICLES.find((a) => a.slug === insightSlug);
  if (!article) {
    gaps.push({
      id: `pdp-insight-map-missing-article-${insightSlug}`,
      severity: 'medium',
      detail: `PRODUCT_TO_INSIGHT_SLUG points to missing insight "${insightSlug}".`,
      fix: 'Add article or fix mapping.',
    });
  }
}

const insightPaths = INSIGHT_ARTICLES.map((a) => insightPath(a.slug));
const insightIndexInGraph = SITE_INTERNAL_RESOURCE_LINKS.some((l) => l.href === '/insights');
if (!insightIndexInGraph) {
  gaps.push({
    id: 'pillar-missing-insights',
    severity: 'high',
    detail: 'SITE_INTERNAL_RESOURCE_LINKS omits /insights.',
    fix: 'Add Lab Insights to pillar links.',
  });
}

const workspaceDir = resolve(
  process.cwd(),
  'Search Growth Engineering Skill/workspaces/research-peptides-uk/intelligence'
);
mkdirSync(workspaceDir, { recursive: true });
const outJson = resolve(workspaceDir, 'internal-linking-plan.json');
const outCsv = resolve(workspaceDir, 'internal_linking_plan.csv');
const outGaps = resolve(workspaceDir, 'internal-linking-gaps.json');

writeFileSync(
  outJson,
  JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      pillar_links: SITE_INTERNAL_RESOURCE_LINKS.length,
      edge_count: rows.length,
      indexable_paths: paths.length,
      public_products: publishedSlugs.size,
      pdp_insight_mappings: Object.keys(PRODUCT_TO_INSIGHT_SLUG).length,
      gaps_open: gaps.length,
      rows,
    },
    null,
    2
  ),
  'utf8'
);

writeFileSync(
  outGaps,
  JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      implemented_fixes_note:
        'See git diff: insight resource nav, PDP↔article links, canonical featured slugs, /about pillar, contact geo nav.',
      gaps,
    },
    null,
    2
  ),
  'utf8'
);

const csvEscape = (value: string) => `"${value.replace(/"/g, '""')}"`;
const csvLines = [
  'from_url,to_url,anchor_text,priority',
  ...rows.map((r) =>
    [csvEscape(r.from), csvEscape(r.to), csvEscape(r.anchor), csvEscape(r.priority)].join(',')
  ),
];
writeFileSync(outCsv, csvLines.join('\n'), 'utf8');
console.log(`Wrote ${rows.length} edges → ${outJson}`);
console.log(`Gaps: ${gaps.length} open → ${outGaps}`);
if (gaps.length > 0) {
  console.log(gaps.slice(0, 10).map((g) => `  [${g.severity}] ${g.detail}`).join('\n'));
}
