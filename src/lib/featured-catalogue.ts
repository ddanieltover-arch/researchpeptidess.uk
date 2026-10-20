/**
 * High-demand SKUs aligned to competitive SERP intelligence (researchpeptide.co.uk / researchpeptides.co.uk).
 * Used for /peptides featured rail and internal linking — not a guarantee every slug is published.
 */

import { Product } from '../types';

export const PEPTIDES_DEMAND_FEATURED_SLUGS: readonly string[] = [
  'bacteriostatic-water-0-9-benzyl',
  'igf-1-lr3-1mg',
  'kpv',
  'glow-blend-ghk-cu-bpc157-tb500',
  'cjc-1295-no-dac-5mg-ipamorelin-5mg',
  'bpc-10mg-tb-10mg-20mg',
  '5-amino-1mq',
  'bpc-157',
  'nad-250mg',
];

export const REAGENT_FOOTER_SLUGS: readonly string[] = [
  'bacteriostatic-water-0-9-benzyl',
  'bacteriostatic-water-0-9-sodium-chloride',
];

export function pickProductsBySlug(products: Product[], slugs: readonly string[]): Product[] {
  const index = new Map(products.map((product) => [product.slug, product]));
  const picked: Product[] = [];
  for (const slug of slugs) {
    const product = index.get(slug);
    if (product) picked.push(product);
  }
  return picked;
}
