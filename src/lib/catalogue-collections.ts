/**
 * First-class catalogue collections mapped onto the existing category architecture.
 * Product membership is never hard-coded here — it follows category records.
 */

export const PEPTIDES_CATEGORY_SLUG = 'peptides-and-analytical-standards';
export const RESEARCH_CHEMICALS_CATEGORY_SLUG = 'research-chemicals';

export const FIRST_CLASS_CATALOGUE_PATHS: Record<string, string> = {
  peptides: PEPTIDES_CATEGORY_SLUG,
  'research-chemicals': RESEARCH_CHEMICALS_CATEGORY_SLUG,
};

export const CATEGORY_SLUG_TO_PUBLIC_PATH: Record<string, string> = {
  [PEPTIDES_CATEGORY_SLUG]: '/peptides',
  [RESEARCH_CHEMICALS_CATEGORY_SLUG]: '/research-chemicals',
};

export function isFirstClassCataloguePath(segment: string): boolean {
  return Object.prototype.hasOwnProperty.call(FIRST_CLASS_CATALOGUE_PATHS, segment);
}

export function resolveFirstClassCategorySlug(segment: string): string | undefined {
  return FIRST_CLASS_CATALOGUE_PATHS[segment];
}

export function publicPathForCategorySlug(slug: string): string {
  return CATEGORY_SLUG_TO_PUBLIC_PATH[slug] || `/category/${slug}`;
}

export function liveCategoryProductCount(
  categoryId: string,
  products: Array<{ categoryId: string; status?: string; visibility?: string }>
): number {
  return products.filter((product) => product.categoryId === categoryId).length;
}
