import fs from 'node:fs/promises';
import { PRODUCTS_EQUIPMENT, PRODUCTS_REAGENTS } from '../../src/lib/data/products-reagents-equipment';
import { PRODUCTS_NASAL } from '../../src/lib/data/products-nasal';
import type { Product } from '../../src/types';
import { ensureLocalImages } from './download-images';
import { fetchCatalogWithVariations } from './fetch-catalog';
import { buildSlugRedirects, writeGeneratedCatalog } from './generate-catalog';
import { extrasToKeep, mapWcProduct, toReportRow } from './map-product';
import { EXISTING_CATALOG } from './match';
import { REPORT_PATH, SCRATCH_DIR } from './paths';
import { assertLiveParity } from './qa-parity';
import { envFileExists, seedNeon } from './seed-neon';

function parseArgs(argv: string[]) {
  return {
    skipImages: argv.includes('--skip-images'),
    skipDb: argv.includes('--skip-db'),
    dryRun: argv.includes('--dry-run'),
    fromCache: argv.includes('--from-cache'),
  };
}

function applyFeatured(products: Product[]): void {
  const featured = products.filter((item) => item.isFeatured && item.status === 'PUBLISHED');
  if (featured.length >= 6) return;
  for (const product of products) {
    if (featured.length >= 8) break;
    if (product.status === 'PUBLISHED' && product.variants.some((item) => item.stock > 0)) {
      product.isFeatured = true;
      featured.push(product);
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log('Fetching WooCommerce catalog…');
  const { products: wcProducts, variations } = await fetchCatalogWithVariations((done, total, label) => {
    process.stdout.write(`\r  detail ${done}/${total} ${label}          `);
  }, args.fromCache);
  process.stdout.write('\n');
  console.log(`Fetched ${wcProducts.length} products`);

  const usedIds = new Set<string>();
  const mapped = wcProducts.map((item) => mapWcProduct(item, variations.get(item.id) || [], usedIds));
  applyFeatured(mapped.map((item) => item.product));

  const extras = extrasToKeep(usedIds);
  const report = {
    generatedAt: new Date().toISOString(),
    sourceCount: wcProducts.length,
    matched: mapped.filter((item) => item.match).length,
    created: mapped.filter((item) => !item.match).length,
    extrasKept: extras,
    rows: mapped.map(toReportRow),
  };

  await fs.mkdir(SCRATCH_DIR, { recursive: true });
  await fs.writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Wrote mapping report to scratch/wc-sync-report.json (${report.matched} matched, ${report.created} new)`);

  if (args.dryRun) {
    console.log('Dry run complete — no images, catalog file, or database writes.');
    return;
  }

  console.log('Rehosting product images (reusing local WebP when present)…');
  for (const item of mapped) {
    const hosted = await ensureLocalImages(
      item.product.slug,
      item.sourceImages,
      (label) => {
        process.stdout.write(`\r  image ${label}                    `);
      },
      args.skipImages
    );
    if (hosted.length > 0) {
      item.product.images = hosted.map((image, index) => ({
        id: `img-${item.product.id}-${index + 1}`,
        productId: item.product.id,
        url: image.publicUrl,
        altText: image.altText,
        sortOrder: index,
        isPrimary: index === 0,
      }));
    }
  }
  process.stdout.write('\n');

  const wcCatalog = mapped.map((item) => item.product);
  await writeGeneratedCatalog({
    generatedAt: new Date().toISOString(),
    sourceCount: wcProducts.length,
    matched: report.matched,
    created: report.created,
    products: wcCatalog,
    slugRedirects: buildSlugRedirects(wcCatalog, EXISTING_CATALOG.filter((row) => usedIds.has(row.id))),
    extrasKept: extras.map((row) => ({ id: row.id, slug: row.slug, kind: row.extraKind || 'core' })),
  });
  console.log('Wrote src/lib/data/generated/from-woocommerce.ts');

  const parity = await assertLiveParity(wcCatalog);
  for (const line of parity) console.log(`  QA ${line}`);

  const extraProducts: Product[] = [
    ...PRODUCTS_NASAL,
    ...PRODUCTS_EQUIPMENT,
    ...PRODUCTS_REAGENTS.filter((item) => extras.some((row) => row.id === item.id)),
  ];
  const storefront = [...wcCatalog, ...extraProducts];

  if (!args.skipDb) {
    if (!envFileExists()) {
      console.warn('Skipping Neon seed — .env not found');
    } else {
      console.log(`Seeding Neon with ${storefront.length} products…`);
      await seedNeon(storefront);
      console.log('Neon upsert complete');
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
