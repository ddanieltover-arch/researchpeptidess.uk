/**
 * Merge duplicate catalogue listings (same compound) and register slug redirects.
 *
 *   tsx scripts/deduplicate-catalog-slugs.ts --dry-run
 *   tsx scripts/deduplicate-catalog-slugs.ts
 */

import fs from 'node:fs/promises';
import {
  deduplicateCatalogProducts,
  findSlugCollisions,
  summarizeDuplicateGroups,
} from './lib/catalog-deduplication';
import { writeGeneratedCatalog } from './woocommerce-sync/generate-catalog';
import { CATALOG_JSON_PATH } from './woocommerce-sync/paths';
import type { GeneratedCatalogFile } from './woocommerce-sync/generate-catalog';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const catalog = JSON.parse(await fs.readFile(CATALOG_JSON_PATH, 'utf8')) as GeneratedCatalogFile;

  const before = catalog.products.length;
  const groupsBefore = summarizeDuplicateGroups(catalog.products);
  console.log(`Catalogue: ${before} products, ${groupsBefore.length} duplicate groups before dedupe.`);

  const { products, slugRedirects, merged } = deduplicateCatalogProducts(
    catalog.products,
    catalog.slugRedirects || {}
  );

  const collisions = findSlugCollisions(products);
  if (collisions.length > 0) {
    throw new Error(`Slug collisions after dedupe: ${collisions.join(', ')}`);
  }

  console.log(`After: ${products.length} products (${before - products.length} removed).`);
  console.log(`Redirects: ${Object.keys(slugRedirects).length} (${merged.length} new merges).`);

  if (merged.length > 0) {
    console.log('\nMerged listings:');
    for (const row of merged) {
      console.log(`  ${row.removedSlug} → ${row.canonicalSlug}`);
    }
  }

  if (dryRun) {
    console.log('\nDry run — no files written.');
    return;
  }

  await writeGeneratedCatalog({
    ...catalog,
    generatedAt: new Date().toISOString(),
    products,
    slugRedirects,
  });
  console.log(`\nUpdated ${CATALOG_JSON_PATH} and slug redirect artifacts.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
