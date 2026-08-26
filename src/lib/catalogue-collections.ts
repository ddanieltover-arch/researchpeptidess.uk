/**
 * First-class catalogue collections mapped onto the existing category architecture.
 * Product membership is never hard-coded here — it follows category records.
 */

export const PEPTIDES_CATEGORY_SLUG = 'peptides-for-sale-online';
export const RESEARCH_CHEMICALS_CATEGORY_SLUG = 'research-chemicals-to-buy';

export const FIRST_CLASS_CATALOGUE_PATHS: Record<string, string> = {
  peptides: PEPTIDES_CATEGORY_SLUG,
  'research-chemicals': RESEARCH_CHEMICALS_CATEGORY_SLUG,
};

export const CATEGORY_SLUG_TO_PUBLIC_PATH: Record<string, string> = {
  [PEPTIDES_CATEGORY_SLUG]: '/peptides',
  [RESEARCH_CHEMICALS_CATEGORY_SLUG]: '/research-chemicals',
};

export const LEGACY_CATEGORY_SLUGS: Record<string, string> = {
  'peptides-and-analytical-standards': PEPTIDES_CATEGORY_SLUG,
  'research-chemicals': RESEARCH_CHEMICALS_CATEGORY_SLUG,
  'biochemical-sequences-and-blends': 'buy-peptides-online',
  'analytical-nasal-and-solution-sprays': PEPTIDES_CATEGORY_SLUG,
  'analytical-solvents-and-media': PEPTIDES_CATEGORY_SLUG,
  'laboratory-consumables': PEPTIDES_CATEGORY_SLUG,
  uncategorized: PEPTIDES_CATEGORY_SLUG,
};

export function resolveCategorySlug(slug: string): string {
  return LEGACY_CATEGORY_SLUGS[slug] || slug;
}

export function isFirstClassCataloguePath(segment: string): boolean {
  return Object.prototype.hasOwnProperty.call(FIRST_CLASS_CATALOGUE_PATHS, segment);
}

export function resolveFirstClassCategorySlug(segment: string): string | undefined {
  return FIRST_CLASS_CATALOGUE_PATHS[segment];
}

export function publicPathForCategorySlug(slug: string): string {
  const resolved = resolveCategorySlug(slug);
  return CATEGORY_SLUG_TO_PUBLIC_PATH[resolved] || `/category/${resolved}`;
}

export function isListedShopCategory(category: { slug?: string; isActive?: boolean } | null | undefined): boolean {
  return Boolean(category?.isActive && category.slug && category.slug !== 'uncategorized');
}

/** Short shop labels — WooCommerce SEO titles must never appear in navigation. */
export const CATEGORY_NAV_LABELS: Record<string, string> = {
  [PEPTIDES_CATEGORY_SLUG]: 'Peptides',
  [RESEARCH_CHEMICALS_CATEGORY_SLUG]: 'Research Chemicals',
  'buy-nootropics-online-shop-the-best-nootropics-supplements': 'Nootropics',
  'buy-peptides-online': 'Featured peptides',
  'buy-sarms-online-usa-high-quality-liquid-sarms-for-sale': 'SARMs',
};

export function categoryNavLabel(category: { slug?: string; name?: string } | null | undefined): string {
  if (!category) return 'Catalogue';
  const slug = category.slug || '';
  if (CATEGORY_NAV_LABELS[slug]) return CATEGORY_NAV_LABELS[slug];
  const name = (category.name || '').trim();
  return name || 'Catalogue';
}

export function isPrimaryCatalogueCategory(category: { slug?: string } | null | undefined): boolean {
  return (
    category?.slug === PEPTIDES_CATEGORY_SLUG || category?.slug === RESEARCH_CHEMICALS_CATEGORY_SLUG
  );
}

export function liveCategoryProductCount(
  categoryId: string,
  products: Array<{ categoryId: string; status?: string; visibility?: string }>
): number {
  return products.filter((product) => product.categoryId === categoryId).length;
}
