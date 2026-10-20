/**
 * Import missing products from a Supabase `products` SQL export (researchpeptide.uk).
 *
 * Usage:
 *   tsx scripts/import-supabase-products-sql.ts --file "C:/path/products_rows.sql"
 *   tsx scripts/import-supabase-products-sql.ts --file ... --dry-run
 *   tsx scripts/import-supabase-products-sql.ts --file ... --seed-neon
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { parseSupabaseProductsSql, SupabaseProductRow } from './lib/parse-supabase-products-sql';
import { ensureLocalImages } from './woocommerce-sync/download-images';
import { writeGeneratedCatalog } from './woocommerce-sync/generate-catalog';
import { CATALOG_JSON_PATH } from './woocommerce-sync/paths';
import type { GeneratedCatalogFile } from './woocommerce-sync/generate-catalog';
import type { Product, ProductImage, ProductVariant } from '../src/types';
import { REMOVED_PRODUCT_SLUGS } from '../src/lib/removed-product-slugs';
import { seedNeon } from './woocommerce-sync/seed-neon';

const CATEGORY_MAP: Record<string, string> = {
  peptides: 'cat-peptides',
  'peptide-blends': 'cat-buy-peptides',
  blends: 'cat-buy-peptides',
  'research-chemicals': 'cat-research-chemicals',
  nootropics: 'cat-nootropics',
  sarms: 'cat-sarms',
};

const CATEGORY_NAMES: Record<string, string> = {
  'cat-peptides': 'Peptides For Sale Online',
  'cat-buy-peptides': 'Buy Peptides Online',
  'cat-research-chemicals': 'Research Chemicals To Buy',
  'cat-nootropics': 'Buy NOOTROPICS Online',
  'cat-sarms': 'Buy SARMs Online USA',
};

function parseArgs(argv: string[]) {
  const fileIndex = argv.indexOf('--file');
  return {
    file: fileIndex >= 0 ? argv[fileIndex + 1] : '',
    dryRun: argv.includes('--dry-run'),
    seedNeon: argv.includes('--seed-neon'),
    limit: Number(argv.find((arg) => arg.startsWith('--limit='))?.split('=')[1] || 0) || undefined,
  };
}

function skuFromSlug(slug: string, suffix = ''): string {
  const base = slug.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');
  const sku = `RPUK-SB-${base}${suffix ? `-${suffix}` : ''}`;
  return sku.length <= 48 ? sku : `RPUK-SB-${base.slice(0, 32)}${suffix ? `-${suffix}` : ''}`.slice(0, 48);
}

function resolveCategoryId(row: SupabaseProductRow): string {
  for (const raw of row.categories) {
    const key = raw.toLowerCase().replace(/\s+/g, '-');
    if (CATEGORY_MAP[key]) return CATEGORY_MAP[key];
  }
  const hay = `${row.title} ${row.slug}`.toLowerCase();
  if (hay.includes('blend') || hay.includes('+')) return 'cat-buy-peptides';
  if (hay.includes('nootropic')) return 'cat-nootropics';
  if (hay.includes('sarm')) return 'cat-sarms';
  return 'cat-peptides';
}

function productTypeFor(row: SupabaseProductRow, categoryId: string): string {
  const hay = `${row.title} ${row.slug}`;
  if (/water|saline|solvent|insulin/i.test(hay)) return 'SOLVENT';
  if (/blend|\+|prefilled pen/i.test(hay) || categoryId === 'cat-buy-peptides') return 'BLEND';
  return 'PEPTIDE';
}

function variantFromSupabase(
  productId: string,
  parentSlug: string,
  variant: SupabaseProductRow['variants'][number],
  index: number,
  fallbackStock: number
): ProductVariant {
  const label =
    variant.display_name?.replace(/^.*-\s*/, '') ||
    Object.values(variant.attributes || {})[0] ||
    'Standard';
  const sizeMatch = label.match(/(\d+(?:\.\d+)?(?:\+\d+(?:\.\d+)?)?)\s*(mg|mcg|iu|ml|g)/i);
  const size = sizeMatch ? `${sizeMatch[1]}${sizeMatch[2].toLowerCase()}` : label.slice(0, 32);
  const price = variant.display_price ?? Number.parseFloat('0');
  const compare = variant.display_regular_price ?? price;
  const stock =
    typeof variant.max_qty === 'number' && variant.max_qty > 0
      ? variant.max_qty
      : variant.is_in_stock === false
        ? 0
        : fallbackStock;
  const sizeToken = size.toUpperCase().replace(/[^A-Z0-9+]+/g, '') || `V${index + 1}`;
  return {
    id: `var-sb-${productId.replace(/^prod-/, '')}-${index + 1}`,
    productId,
    name: `${label} Lyophilized Vial`,
    size,
    sku: skuFromSlug(parentSlug, sizeToken),
    quantityValue: sizeMatch ? Number(sizeMatch[1].split('+')[0]) : undefined,
    quantityUnit: sizeMatch?.[2].toLowerCase() || 'mg',
    price: price > 0 ? price : 0.01,
    compareAtPrice: compare > price ? compare : undefined,
    stock,
    reservedStock: 0,
    lowStockThreshold: 5,
    status: stock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK',
    sortOrder: index,
  };
}

function mapRowToProduct(row: SupabaseProductRow): Product {
  const productId = `prod-sb-${row.id.slice(0, 8)}`;
  const categoryId = resolveCategoryId(row);
  const basePrice = Number.parseFloat(row.price) || 0;
  const variants: ProductVariant[] =
    row.variants.length > 0
      ? row.variants.map((variant, index) => variantFromSupabase(productId, row.slug, variant, index, row.inventory))
      : [
          variantFromSupabase(
            productId,
            row.slug,
            {
              display_name: row.title,
              display_price: basePrice,
              display_regular_price: row.compareAtPrice ? Number.parseFloat(row.compareAtPrice) : basePrice,
              is_in_stock: row.inventory > 0,
              max_qty: row.inventory,
            },
            0,
            row.inventory
          ),
        ];

  const inStock = variants.some((variant) => variant.stock > 0);
  const images: ProductImage[] = row.images.map((url, index) => ({
    id: `img-${productId}-${index + 1}`,
    productId,
    url,
    altText: row.title,
    sortOrder: index,
    isPrimary: index === 0,
  }));

  const now = new Date().toISOString();
  const shortDescription =
    row.description.split('\n').find((line) => line.trim().length > 20)?.trim() ||
    row.description.trim().slice(0, 280) ||
    `${row.title} — supplied for in-vitro laboratory research only.`;

  return {
    id: productId,
    name: row.title.replace(/\s+/g, ' ').trim(),
    slug: row.slug,
    sku: skuFromSlug(row.slug),
    categoryId,
    categoryName: CATEGORY_NAMES[categoryId],
    shortDescription,
    longDescription: row.description.trim() || shortDescription,
    productType: productTypeFor(row, categoryId),
    researchClassification: /water|saline|solvent|insulin/i.test(row.title) ? 'BIOCHEMICAL_REAGENT' : 'IN_VITRO_ONLY',
    status: inStock ? 'PUBLISHED' : 'OUT_OF_STOCK',
    visibility: 'PUBLIC',
    isFeatured: false,
    researchOnly: true,
    appearance: /water|saline|solvent/i.test(row.title) ? 'Clear, Colourless Liquid' : 'Lyophilized White Powder',
    storageRequirements: /water|saline|solvent/i.test(row.title)
      ? 'Store sealed at ambient laboratory temperature'
      : 'Store sealed at -20°C in desiccated laboratory freezer',
    solubility: /water|saline|solvent/i.test(row.title)
      ? 'Ready-to-use sterile laboratory solvent'
      : 'Sterile Water / Bacteriostatic Laboratory Solvent',
    documentationStatus: 'PENDING',
    analyticalDataSource: 'UNAVAILABLE',
    manufacturer: 'Research Peptides UK Laboratory Services',
    origin: 'United Kingdom',
    createdBy: 'supabase-sql-import',
    updatedBy: 'supabase-sql-import',
    createdAt: row.createdAt || now,
    updatedAt: now,
    publishedAt: now,
    variants,
    images,
    documents: [],
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.file) {
    throw new Error('Pass --file "C:/path/products_rows.sql"');
  }

  const sql = await fs.readFile(path.resolve(args.file), 'utf8');
  const rows = parseSupabaseProductsSql(sql);
  const catalog = JSON.parse(await fs.readFile(CATALOG_JSON_PATH, 'utf8')) as GeneratedCatalogFile;
  const existingSlugs = new Set(catalog.products.map((product) => product.slug));
  const existingSkus = new Set(catalog.products.map((product) => product.sku));

  const candidates = rows.filter((row) => !existingSlugs.has(row.slug) && !REMOVED_PRODUCT_SLUGS.has(row.slug));
  const toImport = args.limit ? candidates.slice(0, args.limit) : candidates;

  console.log(`Parsed ${rows.length} Supabase rows.`);
  console.log(`${candidates.length} not yet in local catalog (${toImport.length} selected for import).`);

  if (toImport.length === 0) {
    console.log('Nothing to import.');
    return;
  }

  const imported: Product[] = [];
  for (const row of toImport) {
    const product = mapRowToProduct(row);
    if (existingSkus.has(product.sku)) {
      product.sku = `${product.sku}-${product.id.slice(-4)}`.slice(0, 48);
    }

    if (!args.dryRun && product.images.some((image) => image.url.startsWith('http'))) {
      const hosted = await ensureLocalImages(
        product.slug,
        product.images.map((image, index) => ({
          sourceUrl: image.url,
          localPath: '',
          publicUrl: image.url,
          altText: image.altText,
          sortOrder: index,
          isPrimary: image.isPrimary,
        })),
        (label) => process.stdout.write(`\r  ${product.slug}: ${label}          `)
      );
      process.stdout.write('\n');
      if (hosted.length > 0) {
        product.images = hosted.map((image, index) => ({
          id: `img-${product.id}-${index + 1}`,
          productId: product.id,
          url: image.publicUrl,
          altText: image.altText,
          sortOrder: index,
          isPrimary: index === 0,
        }));
      }
    }

    imported.push(product);
    console.log(`  + ${product.slug} (${product.variants.length} variant(s))`);
  }

  if (args.dryRun) {
    console.log('Dry run — no files or database updated.');
    return;
  }

  const nextProducts = [...catalog.products, ...imported];
  await writeGeneratedCatalog({
    ...catalog,
    generatedAt: new Date().toISOString(),
    sourceCount: rows.length,
    created: catalog.created + imported.length,
    products: nextProducts,
  });
  console.log(`Wrote ${imported.length} products to ${CATALOG_JSON_PATH}`);

  if (args.seedNeon) {
    const storefront = [...nextProducts];
    console.log(`Seeding Neon with ${storefront.length} catalogue products…`);
    await seedNeon(storefront);
    console.log('Neon upsert complete.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
