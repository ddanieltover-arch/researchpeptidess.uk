import type { Product, ProductImage, ProductVariant } from '../../src/types';
import { compactKey, compoundKey, isBlendName, matchExisting } from '../woocommerce-sync/match';

export interface DeduplicationResult {
  products: Product[];
  slugRedirects: Record<string, string>;
  merged: Array<{ removedSlug: string; canonicalSlug: string; removedId: string; canonicalId: string }>;
}

function isPenListing(name: string, slug: string): boolean {
  return /\bpen\b/i.test(`${name} ${slug}`);
}

function isMultipack(name: string, slug: string): boolean {
  return /\bx-?10-?vials\b|\b10\s*vials\b/i.test(`${name} ${slug}`);
}

function isSolventListing(product: Product): boolean {
  if (product.productType === 'SOLVENT' || product.researchClassification === 'BIOCHEMICAL_REAGENT') {
    return true;
  }
  return /bacteriostatic|saline|sodium-chloride|benzyl|solvent|acetic-acid/i.test(`${product.name} ${product.slug}`);
}

export function productGroupKey(product: Product): string {
  const legacy = isSolventListing(product) ? null : matchExisting(product.name, product.slug, new Set());
  const compound = legacy?.id ?? `unmapped:${compactKey(product.slug) || compoundKey(product.name, product.slug, false)}`;
  const blend = isBlendName(product.name, product.slug);
  const pen = isPenListing(product.name, product.slug);
  const multipack = isMultipack(product.name, product.slug);
  return `${blend ? 'blend' : 'unit'}:${pen ? 'pen' : 'vial'}:${multipack ? 'pack10' : 'std'}:${compound}`;
}

function canonicalScore(product: Product): number {
  let score = 0;
  if (product.id.startsWith('prod-wc-')) score += 120;
  else if (!product.id.startsWith('prod-sb-')) score += 80;
  if (product.status === 'PUBLISHED') score += 25;
  if (product.isFeatured) score += 8;
  const inStock = product.variants.filter((variant) => variant.stock > 0).length;
  score += inStock * 6;
  score += Math.min(product.variants.length, 8);
  if (product.images.some((image) => image.url.startsWith('/products/'))) score += 12;
  if (product.longDescription.length > 400) score += 5;
  if (product.slug.length <= 12) score += 4;
  score -= product.slug.length * 0.15;
  return score;
}

function variantKey(variant: ProductVariant): string {
  return `${variant.size.toLowerCase()}|${variant.sku.toUpperCase()}`;
}

function mergeCatalogProducts(winner: Product, loser: Product): Product {
  const variants: ProductVariant[] = [...winner.variants];
  const variantKeys = new Set(variants.map(variantKey));

  for (const variant of loser.variants) {
    const key = variantKey(variant);
    if (variantKeys.has(key)) continue;
    variants.push({
      ...variant,
      id: `${variant.id}-from-${loser.slug}`.slice(0, 64),
      productId: winner.id,
    });
    variantKeys.add(key);
  }

  const images: ProductImage[] = [...winner.images];
  const imageUrls = new Set(images.map((image) => image.url));
  for (const image of loser.images) {
    if (imageUrls.has(image.url)) continue;
    images.push({
      ...image,
      id: `${image.id}-from-${loser.slug}`.slice(0, 64),
      productId: winner.id,
      sortOrder: images.length,
      isPrimary: false,
    });
    imageUrls.add(image.url);
  }

  const inStock = variants.some((variant) => variant.stock > 0);
  const longDescription =
    winner.longDescription.length >= loser.longDescription.length
      ? winner.longDescription
      : loser.longDescription;

  return {
    ...winner,
    variants: variants.map((variant, index) => ({ ...variant, sortOrder: index })),
    images,
    longDescription,
    shortDescription: winner.shortDescription || loser.shortDescription,
    status: inStock ? 'PUBLISHED' : winner.status,
    isFeatured: winner.isFeatured || loser.isFeatured,
  };
}

function resolveRedirectChain(slug: string, redirects: Record<string, string>): string {
  const seen = new Set<string>();
  let current = slug;
  while (redirects[current] && !seen.has(current)) {
    seen.add(current);
    current = redirects[current];
  }
  return current;
}

export function deduplicateCatalogProducts(
  products: Product[],
  existingRedirects: Record<string, string> = {}
): DeduplicationResult {
  const groups = new Map<string, Product[]>();
  for (const product of products) {
    const key = productGroupKey(product);
    const bucket = groups.get(key) || [];
    bucket.push(product);
    groups.set(key, bucket);
  }

  const kept: Product[] = [];
  const merged: DeduplicationResult['merged'] = [];
  const slugRedirects: Record<string, string> = { ...existingRedirects };

  for (const [, bucket] of groups) {
    if (bucket.length === 1) {
      kept.push(bucket[0]);
      continue;
    }

    const ranked = [...bucket].sort((a, b) => canonicalScore(b) - canonicalScore(a));
    let winner = ranked[0];

    for (const loser of ranked.slice(1)) {
      if (loser.slug === winner.slug) continue;
      winner = mergeCatalogProducts(winner, loser);
      merged.push({
        removedSlug: loser.slug,
        canonicalSlug: winner.slug,
        removedId: loser.id,
        canonicalId: winner.id,
      });
      slugRedirects[loser.slug] = winner.slug;
    }

    kept.push(winner);
  }

  const keptSlugs = new Set(kept.map((product) => product.slug));
  for (const [from, to] of Object.entries({ ...slugRedirects })) {
    const resolved = resolveRedirectChain(to, slugRedirects);
    if (!keptSlugs.has(resolved)) {
      delete slugRedirects[from];
      continue;
    }
    slugRedirects[from] = resolved;
  }

  const uniqueKept = new Map<string, Product>();
  for (const product of kept) {
    uniqueKept.set(product.slug, product);
  }

  return {
    products: [...uniqueKept.values()],
    slugRedirects,
    merged,
  };
}

export function findSlugCollisions(products: Product[]): string[] {
  const seen = new Map<string, string>();
  const collisions: string[] = [];
  for (const product of products) {
    const prev = seen.get(product.slug);
    if (prev && prev !== product.id) collisions.push(product.slug);
    seen.set(product.slug, product.id);
  }
  return collisions;
}

export function summarizeDuplicateGroups(products: Product[]): Array<{ key: string; slugs: string[] }> {
  const groups = new Map<string, string[]>();
  for (const product of products) {
    const key = productGroupKey(product);
    const list = groups.get(key) || [];
    list.push(product.slug);
    groups.set(key, list);
  }
  return [...groups.entries()]
    .filter(([, slugs]) => slugs.length > 1)
    .map(([key, slugs]) => ({ key, slugs: [...slugs].sort() }))
    .sort((a, b) => b.slugs.length - a.slugs.length);
}
