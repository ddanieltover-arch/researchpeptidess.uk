import { Product } from '../types';

/** WooCommerce imports often arrive with 0 stock. The storefront sells every listed variant. */
export const STOREFRONT_MIN_VARIANT_STOCK = 50;

export function withPurchasableCatalogueStock(product: Product): Product {
  const variants = (product.variants || []).map((variant) => {
    const stock = Math.max(Number(variant.stock) || 0, STOREFRONT_MIN_VARIANT_STOCK);
    return {
      ...variant,
      stock,
      reservedStock: 0,
      status: variant.status === 'ARCHIVED' ? variant.status : ('ACTIVE' as const),
    };
  });

  return {
    ...product,
    status: product.status === 'OUT_OF_STOCK' ? 'PUBLISHED' : product.status,
    variants,
  };
}
