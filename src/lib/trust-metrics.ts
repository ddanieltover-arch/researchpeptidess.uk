import { Product, ProductCategory, ShippingMethod } from '../types';
import { RESEARCH_DESTINATION_COUNTRIES } from './shipping-engine';
import { isStorefrontVisible } from './merchandising';

export interface StorefrontTrustMetrics {
  publishedProductCount: number;
  documentedProductCount: number;
  activeCategoryCount: number;
  fulfilmentRegionCount: number;
  activeShippingMethodCount: number;
}

export function getStorefrontTrustMetrics(
  products: Product[],
  categories: ProductCategory[],
  shippingMethods: ShippingMethod[]
): StorefrontTrustMetrics {
  const visible = products.filter(isStorefrontVisible);
  const documentedProductCount = visible.filter(
    (product) =>
      product.documentationStatus === 'AVAILABLE' ||
      product.documentationStatus === 'VERIFIED' ||
      (product.documents && product.documents.length > 0)
  ).length;

  const activeMethods = shippingMethods.filter((method) => method.isActive);
  const fulfilmentRegionCount = new Set(
    RESEARCH_DESTINATION_COUNTRIES.filter((country) => country.isEligible).map((country) => country.defaultZone)
  ).size;

  return {
    publishedProductCount: visible.length,
    documentedProductCount,
    activeCategoryCount: categories.filter((category) => category.isActive).length,
    fulfilmentRegionCount,
    activeShippingMethodCount: activeMethods.length,
  };
}
