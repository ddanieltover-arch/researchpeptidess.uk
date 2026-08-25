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

export function getCartCrossSellProducts(
  cartProductIds: string[],
  catalogue: Product[],
  limit = 4
): Product[] {
  const inCart = new Set(cartProductIds.filter(Boolean));
  if (inCart.size === 0 || limit <= 0) return [];

  const cartProducts = [...inCart]
    .map((id) => catalogue.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product));

  const published = catalogue.filter(
    (item) => isPublicCatalogueProduct(item) && !inCart.has(item.id)
  );

  const merged: Product[] = [];
  const seen = new Set<string>();
  const push = (item: Product) => {
    if (seen.has(item.id) || inCart.has(item.id) || !isPublicCatalogueProduct(item)) return;
    seen.add(item.id);
    merged.push(item);
  };

  for (const product of cartProducts) {
    for (const related of getRelatedProducts(product, catalogue, limit)) {
      push(related);
      if (merged.length >= limit) return merged;
    }
  }

  const categoryIds = new Set(cartProducts.map((product) => product.categoryId));
  for (const item of published) {
    if (!categoryIds.has(item.categoryId)) continue;
    push(item);
    if (merged.length >= limit) return merged;
  }

  for (const item of published) {
    push(item);
    if (merged.length >= limit) break;
  }

  return merged;
}
