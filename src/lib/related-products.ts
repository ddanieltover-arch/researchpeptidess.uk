import { Product } from '../types';
import { isPublicCatalogueProduct } from './merchandising';

export function getRelatedProducts(product: Product, catalogue: Product[], limit = 3): Product[] {
  const published = catalogue.filter(
    (item) => item.id !== product.id && isPublicCatalogueProduct(item)
  );

  const sameCategory = published.filter((item) => item.categoryId === product.categoryId);
  const sameType = published.filter(
    (item) => item.productType === product.productType && item.categoryId !== product.categoryId
  );

  const merged: Product[] = [];
  const seen = new Set<string>();
  for (const item of [...sameCategory, ...sameType]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
    if (merged.length >= limit) break;
  }
  return merged;
}
