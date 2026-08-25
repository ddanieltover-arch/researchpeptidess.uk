import { Product } from '../types';
import { INITIAL_CATEGORIES } from './data/categories';

const CATEGORY_BY_ID = Object.fromEntries(INITIAL_CATEGORIES.map((category) => [category.id, category]));

/** Exclusive shop-category assignment from researchpeptide.co.uk, most specific first. */
const SLUG_TO_CATEGORY_ID: Record<string, string> = {
  kisspeptin: 'cat-nootropics',

  'glow-blend-ghk-cu-bpc157-tb500': 'cat-sarms',
  'melatonin-10mg': 'cat-sarms',
  'mk-677-ibutamoren-10mg-100-tablets': 'cat-sarms',

  tirzepatide: 'cat-research-chemicals',
  'hexarelin-acetate': 'cat-research-chemicals',

  'nad-250mg': 'cat-buy-peptides',
  kpv: 'cat-buy-peptides',
  'tesamorelin-5mg-ipamorelin-5mg': 'cat-buy-peptides',
  'slu-pp-332': 'cat-buy-peptides',
  'hcg-human-chorionic-gonadotropin': 'cat-buy-peptides',
  'gagrilintide-5mg': 'cat-buy-peptides',
  'bacteriostatic-water-0-9-benzyl': 'cat-buy-peptides',
  'glutathione-peptide': 'cat-buy-peptides',
  reta: 'cat-buy-peptides',
  '5-amino-1mq': 'cat-buy-peptides',
  'bpc-5mg-tb-5mg': 'cat-buy-peptides',
  'hgh-fragment-176-191-10mg': 'cat-buy-peptides',

  'tesamorelin-13mg-ipamorelin-3mg-16mg-blend': 'cat-buy-peptides',
  'tesofensine-500mcg-100-tablets': 'cat-research-chemicals',
  'thymalin-10mg': 'cat-peptides',
};

const LEGACY_EXTRA_CATEGORY_IDS = new Set(['cat-nasal', 'cat-reagents', 'cat-equipment', 'cat-sequences']);

function assign(product: Product, categoryId: string): Product {
  const category = CATEGORY_BY_ID[categoryId];
  if (!category) return product;
  return {
    ...product,
    categoryId: category.id,
    categoryName: category.name,
  };
}

export function applyShopCategory(product: Product): Product {
  const mappedId = SLUG_TO_CATEGORY_ID[product.slug];
  if (mappedId && CATEGORY_BY_ID[mappedId]) return assign(product, mappedId);
  if (LEGACY_EXTRA_CATEGORY_IDS.has(product.categoryId)) return assign(product, 'cat-peptides');
  if (product.categoryId === 'cat-uncategorized' || !CATEGORY_BY_ID[product.categoryId]) {
    return assign(product, 'cat-peptides');
  }
  return assign(product, product.categoryId);
}
