import fs from 'node:fs/promises';
import path from 'node:path';
import type { Product } from '../../src/types';
import { PUBLIC_PRODUCTS_DIR } from './paths';

function variant(product: Product | undefined, size: string) {
  return product?.variants.find((item) => item.size.toLowerCase() === size.toLowerCase());
}

function expectEqual(label: string, actual: unknown, expected: unknown, failures: string[]) {
  if (actual !== expected) {
    failures.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

export async function assertLiveParity(products: Product[]): Promise<string[]> {
  const failures: string[] = [];
  const lines: string[] = [];

  const bySlug = new Map(products.map((item) => [item.slug, item]));
  const bpc = bySlug.get('bpc-157');
  const ghk = bySlug.get('ghk-cu');
  const bac = bySlug.get('bacteriostatic-water-0-9-benzyl');
  const tesaBlend = bySlug.get('tesamorelin-5mg-ipamorelin-5mg');
  const tesa = bySlug.get('tesamorelin');
  const nad = bySlug.get('nad-250mg');
  const mt2 = bySlug.get('mt-2-melanotan-2-acetate-10mg') || products.find((item) => item.id === 'prod-mt2');

  expectEqual('BPC-157 present', Boolean(bpc), true, failures);
  expectEqual('BPC-157 id', bpc?.id, 'prod-bpc157', failures);
  expectEqual('BPC-157 5mg GBP', variant(bpc, '5mg')?.price, 15.99, failures);
  expectEqual('BPC-157 10mg GBP', variant(bpc, '10mg')?.price, 29, failures);
  expectEqual('BPC-157 5mg stock', variant(bpc, '5mg')?.stock, 91, failures);
  expectEqual('BPC-157 gallery count', bpc?.images.length, 3, failures);
  expectEqual('BPC-157 sequence suffix', bpc?.sequence?.includes('Molecular Formula'), false, failures);

  expectEqual('GHK-Cu present', Boolean(ghk), true, failures);
  expectEqual('GHK-Cu 50mg GBP', variant(ghk, '50mg')?.price, 25, failures);
  expectEqual('GHK-Cu 100mg GBP', variant(ghk, '100mg')?.price, 40, failures);
  expectEqual('GHK-Cu sequence', ghk?.sequence, 'Gly-His-Lys', failures);

  expectEqual('BAC water present', Boolean(bac), true, failures);
  expectEqual('BAC water GBP', bac?.variants[0]?.price, 15, failures);
  expectEqual('BAC water category', bac?.categoryId, 'cat-buy-peptides', failures);
  expectEqual(
    'BAC water copy avoids Injection rewrite',
    bac?.longDescription.includes('laboratory administration in experimental models USP'),
    false,
    failures
  );

  expectEqual('Tesamorelin present', Boolean(tesa), true, failures);
  expectEqual('Tesamorelin + Ipamorelin blend present', Boolean(tesaBlend), true, failures);
  expectEqual('NAD+ out of stock', nad?.status, 'OUT_OF_STOCK', failures);
  expectEqual('MT-2 matched existing id', mt2?.id, 'prod-mt2', failures);

  let hotlinked = 0;
  let missingFiles = 0;
  for (const product of products) {
    for (const image of product.images) {
      if (!image.url.startsWith('/products/')) {
        hotlinked += 1;
        continue;
      }
      try {
        await fs.access(path.join(PUBLIC_PRODUCTS_DIR, image.url.replace(/^\/products\//, '')));
      } catch {
        missingFiles += 1;
      }
    }
  }

  expectEqual('hotlinked WooCommerce/Unsplash URLs on synced products', hotlinked, 0, failures);
  expectEqual('missing local image files', missingFiles, 0, failures);

  lines.push(`synced=${products.length} images-ok=${hotlinked === 0 && missingFiles === 0}`);
  if (failures.length) {
    throw new Error(`Catalog QA failed:\n- ${failures.join('\n- ')}`);
  }
  lines.push('live parity checks passed (BPC-157, GHK-Cu, BAC water, Tesamorelin, NAD+, MT-2, local photos)');
  return lines;
}
