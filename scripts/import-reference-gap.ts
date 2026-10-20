/**
 * Import WooCommerce listings from researchpeptide.co.uk that are not yet in woocommerce-catalog.json.
 * Compare against the reference shop (researchpeptide.uk) which shares the same legacy catalogue source.
 *
 * Usage: tsx scripts/import-reference-gap.ts [--dry-run]
 */

import fs from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ensureLocalImages } from './woocommerce-sync/download-images';
import { writeGeneratedCatalog } from './woocommerce-sync/generate-catalog';
import { mapWcProduct } from './woocommerce-sync/map-product';
import { htmlToWcProduct } from './woocommerce-sync/parse-html';
import { CATALOG_JSON_PATH } from './woocommerce-sync/paths';
import type { GeneratedCatalogFile } from './woocommerce-sync/generate-catalog';
import type { Product } from '../src/types';

const execFileAsync = promisify(execFile);
const CURL = process.platform === 'win32' ? 'curl.exe' : 'curl';
const WP_PRODUCTS = 'https://researchpeptide.co.uk/wp-json/wp/v2/product';
const USER_AGENT = 'Mozilla/5.0';

interface WpProduct {
  id: number;
  slug: string;
  link: string;
  status: string;
  title: { rendered: string };
}

async function curlGet(url: string): Promise<string> {
  const { stdout } = await execFileAsync(CURL, ['-sS', '-A', USER_AGENT, url], {
    maxBuffer: 32 * 1024 * 1024,
    timeout: 120000,
  });
  return stdout;
}

async function fetchReferenceSlugs(): Promise<WpProduct[]> {
  const raw = await curlGet(`${WP_PRODUCTS}?per_page=100`);
  const list = JSON.parse(raw) as WpProduct[];
  return list.filter((item) => item.status === 'publish');
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const catalog = JSON.parse(await fs.readFile(CATALOG_JSON_PATH, 'utf8')) as GeneratedCatalogFile;
  const localSlugs = new Set(catalog.products.map((item) => item.slug));
  const reference = await fetchReferenceSlugs();
  const missing = reference.filter((item) => !localSlugs.has(item.slug));

  if (missing.length === 0) {
    console.log('Catalog is in parity with reference WooCommerce (no missing slugs).');
    return;
  }

  console.log(`Missing ${missing.length} listing(s) vs reference:`);
  for (const item of missing) {
    console.log(`  - ${item.slug}`);
  }

  const usedIds = new Set(catalog.products.map((item) => item.id));
  const imported: Product[] = [];

  for (const wp of missing) {
    console.log(`Fetching ${wp.slug}…`);
    const html = await curlGet(wp.link);
    const parsed = htmlToWcProduct(wp, html);
    const mapped = mapWcProduct(parsed.product, parsed.variationDetails, usedIds);
    if (mapped.match) {
      console.warn(`  Warning: mapped to existing id ${mapped.match.id} — forcing new Woo id`);
      mapped.product.id = `prod-wc-${wp.id}`;
      mapped.product.variants = mapped.product.variants.map((variant, index) => ({
        ...variant,
        id: `var-wc-${wp.id}-${index + 1}`,
        productId: mapped.product.id,
      }));
      mapped.product.images = mapped.product.images.map((image, index) => ({
        ...image,
        id: `img-wc-${wp.id}-${index + 1}`,
        productId: mapped.product.id,
      }));
    } else {
      usedIds.add(mapped.product.id);
    }

    if (!dryRun) {
      const hosted = await ensureLocalImages(mapped.product.slug, mapped.sourceImages, (label) => {
        process.stdout.write(`\r  image ${label}          `);
      });
      process.stdout.write('\n');
      if (hosted.length > 0) {
        mapped.product.images = hosted.map((image, index) => ({
          id: `img-${mapped.product.id}-${index + 1}`,
          productId: mapped.product.id,
          url: image.publicUrl,
          altText: image.altText,
          sortOrder: index,
          isPrimary: index === 0,
        }));
      }
    }

    imported.push(mapped.product);
    console.log(`  → ${mapped.product.name} (£${mapped.product.variants[0]?.price ?? '?'})`);
  }

  if (dryRun) {
    console.log('Dry run — no catalog writes.');
    return;
  }

  const nextProducts = [...catalog.products, ...imported];
  await writeGeneratedCatalog({
    ...catalog,
    generatedAt: new Date().toISOString(),
    sourceCount: reference.length,
    created: catalog.created + imported.length,
    products: nextProducts,
  });
  console.log(`Wrote ${imported.length} product(s) to ${CATALOG_JSON_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
