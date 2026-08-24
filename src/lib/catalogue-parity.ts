/**
 * Competitive catalogue comparison against the public reference shop.
 * This is an audit aid only — it never imports or publishes products.
 */

import { Product } from '../types';

export interface ReferenceCatalogueItem {
  name: string;
  notes?: string;
}

export const REFERENCE_SHOP_PRODUCTS: ReferenceCatalogueItem[] = [
  { name: 'Tesofensine 500mcg (100 tablets)' },
  { name: 'Tesamorelin 13mg | Ipamorelin 3mg (16mg Total Peptide Blend)' },
  { name: 'MK-677 / Ibutamoren 10mg (100 Tablets)' },
  { name: 'CJC-1295 No DAC 5mg, Ipamorelin 5mg (10mg Total Peptide Blend)' },
  { name: 'BPC 157 10mg + TB-500 10mg (20mg) – Wolverine Peptide Blend' },
  { name: 'Tesamorelin 5mg | Ipamorelin 5mg (10mg Total Peptide Blend)' },
  { name: 'IGF 1 DES 1mg' },
  { name: 'MT-1 (Melanotan 1 Acetate) 10mg' },
  { name: 'HCG (Human Chorionic Gonadotropin) 5000iu' },
  { name: 'HGH Fragment 176-191 10mg' },
  { name: 'BPC 5mg + TB 5mg' },
  { name: 'Thymosin Beta 4 (TB500) 10mg' },
  { name: 'MT-2 (Melanotan 2 Acetate) 10mg' },
  { name: 'Thymosin Beta 4 (TB500) 5mg' },
  { name: 'HGH Fragment 176-191 5mg' },
  { name: 'MOTS-C – Mitochondrial-Derived Peptide' },
  { name: 'CJC 1295 NO DAC 5MG' },
  { name: 'CJC 1295 with DAC 2MG' },
  { name: 'DSIP (Delta Sleep Inducing Peptide)' },
  { name: 'Bacteriostatic Water 0.9% Benzyl Alcohol 10mL – Hospira Injection USP' },
  { name: 'Bacteriostatic Water 0.9% Sodium Chloride 10mL – Hospira USP Injection' },
  { name: 'GHRP 2 (Pralmorelin) 5mg' },
  { name: 'Tesamorelin 2mg', notes: 'Homepage featured variant on the reference site' },
];

export const REFERENCE_CATEGORIES_NOT_REPLICATED = [
  'Buy NOOTROPICS Online',
  'Buy SARMs Online USA',
  'Uncategorized',
];

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function findCatalogueMatch(referenceName: string, products: Product[]): Product | undefined {
  const target = normalizeName(referenceName);
  return products.find((product) => {
    const candidates = [product.name, product.slug, ...(product.variants || []).map((variant) => `${product.name} ${variant.size}`)];
    return candidates.some((value) => {
      const normalized = normalizeName(value);
      return normalized === target || normalized.includes(target) || target.includes(normalized);
    });
  });
}

export function compareReferenceCatalogue(products: Product[]): {
  matched: string[];
  missing: Array<{ name: string; notes?: string }>;
} {
  const matched: string[] = [];
  const missing: Array<{ name: string; notes?: string }> = [];
  for (const item of REFERENCE_SHOP_PRODUCTS) {
    const found = findCatalogueMatch(item.name, products);
    if (found) matched.push(item.name);
    else missing.push(item);
  }
  return { matched, missing };
}
