import fs from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const CURL = process.platform === 'win32' ? 'curl.exe' : 'curl';
const WP = 'https://researchpeptide.co.uk/wp-json/wp/v2/product';

const catalog = JSON.parse(
  fs.readFileSync('src/lib/data/generated/woocommerce-catalog.json', 'utf8')
);
const ourSlugs = new Set(catalog.products.map((p) => p.slug));
const ourNames = new Map(catalog.products.map((p) => [p.slug, p.name]));

async function curlGet(url) {
  const { stdout } = await execFileAsync(CURL, ['-sS', '-A', 'Mozilla/5.0', url], {
    maxBuffer: 16 * 1024 * 1024,
    timeout: 120000,
  });
  return stdout;
}

const raw = await curlGet(`${WP}?per_page=100`);
const ref = JSON.parse(raw).filter((p) => p.status === 'publish');

const missing = [];
const matched = [];

for (const item of ref) {
  const title = item.title?.rendered?.replace(/<[^>]+>/g, '') || item.slug;
  if (ourSlugs.has(item.slug)) {
    matched.push({ slug: item.slug, title });
  } else {
    missing.push({ slug: item.slug, title, link: item.link, id: item.id });
  }
}

const onlyLocal = catalog.products
  .filter((p) => !ref.some((r) => r.slug === p.slug))
  .map((p) => ({ slug: p.slug, name: p.name }));

const out = {
  referenceDomain: 'researchpeptide.co.uk (WP API; researchpeptide.uk shop is same brand)',
  referencePublishedCount: ref.length,
  localCatalogCount: catalog.products.length,
  matchedCount: matched.length,
  missingOnLocal: missing,
  onlyOnLocal: onlyLocal,
  generatedAt: new Date().toISOString(),
};

fs.mkdirSync('scratch', { recursive: true });
fs.writeFileSync('scratch/catalog-gap-report.json', `${JSON.stringify(out, null, 2)}\n`);

console.log(`Reference: ${ref.length} | Local: ${catalog.products.length} | Matched: ${matched.length}`);
console.log(`Missing on local (${missing.length}):`);
for (const row of missing) {
  console.log(`  - ${row.slug} | ${row.title}`);
}
console.log(`\nOnly on local (${onlyLocal.length}):`);
for (const row of onlyLocal.slice(0, 15)) {
  console.log(`  - ${row.slug}`);
}
if (onlyLocal.length > 15) console.log(`  ... +${onlyLocal.length - 15} more`);
