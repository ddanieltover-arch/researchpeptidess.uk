/**
 * Storefront product presentation helpers.
 * Prices, stock, and documentation labels are derived from catalogue records only.
 */

import { DocumentationStatus, Product, ProductVariant } from '../types';
import { formatPrice } from './utils';

export function getPurchasableVariants(product: Product): ProductVariant[] {
  return (product.variants || []).filter(
    (variant) => variant.status === 'ACTIVE' || variant.status === 'LOW_STOCK'
  );
}

export function hasSelectableOptions(product: Product): boolean {
  return getPurchasableVariants(product).length > 1;
}

export function getProductPriceBounds(product: Product): { min: number; max: number } | null {
  const variants = getPurchasableVariants(product);
  const source = variants.length > 0 ? variants : product.variants || [];
  if (source.length === 0) return null;
  const prices = source.map((variant) => variant.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function formatProductPriceFrom(product: Product, currency: 'GBP' | 'EUR' = 'GBP'): string {
  const bounds = getProductPriceBounds(product);
  if (!bounds) return 'Price unavailable';
  if (bounds.min === bounds.max) return formatPrice(bounds.min, currency);
  return `From ${formatPrice(bounds.min, currency)}`;
}

export function formatProductPriceRange(product: Product, currency: 'GBP' | 'EUR' = 'GBP'): string {
  const bounds = getProductPriceBounds(product);
  if (!bounds) return 'Price unavailable';
  if (bounds.min === bounds.max) return formatPrice(bounds.min, currency);
  return `${formatPrice(bounds.min, currency)} – ${formatPrice(bounds.max, currency)}`;
}

export function getProductCardCta(product: Product): 'ADD_TO_CART' | 'SELECT_OPTIONS' | 'VIEW_DETAILS' {
  const purchasable = getPurchasableVariants(product);
  if (purchasable.length > 1) return 'SELECT_OPTIONS';
  if (purchasable.length === 1 && purchasable[0].stock > 0) return 'ADD_TO_CART';
  return 'VIEW_DETAILS';
}

export function getStockPresentation(product: Product): {
  inStock: boolean;
  label: string;
  variantCount: number;
} {
  const purchasable = getPurchasableVariants(product);
  return {
    inStock: true,
    label: 'In stock',
    variantCount: purchasable.length,
  };
}

export type DocumentationTone = 'available' | 'pending' | 'unavailable' | 'demo';

export function getDocumentationPresentation(product: Product): {
  tone: DocumentationTone;
  label: string;
  shortLabel: string;
} {
  if (product.analyticalDataSource === 'DEMO') {
    return { tone: 'demo', label: 'Demonstration documentation only', shortLabel: 'Demo docs' };
  }
  const status: DocumentationStatus = product.documentationStatus;
  if (status === 'VERIFIED' || status === 'AVAILABLE') {
    return { tone: 'available', label: 'Batch documentation available', shortLabel: 'Docs available' };
  }
  if (status === 'PENDING') {
    return { tone: 'pending', label: 'Documentation pending', shortLabel: 'Docs pending' };
  }
  return { tone: 'unavailable', label: 'Documentation unavailable', shortLabel: 'No docs' };
}

const DISPLAY_NAME_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bNad\+/gi, 'NAD+'],
  [/\bGHK-CU\b/g, 'GHK-Cu'],
  [/\bKissPeptin\b/g, 'Kisspeptin'],
  [/\b5-amino-1mq\b/gi, '5-Amino-1MQ'],
];

export function formatProductDisplayName(name: string): string {
  const source = typeof name === 'string' ? name : '';
  return DISPLAY_NAME_REPLACEMENTS.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), source);
}

export function documentedPurityLabel(product: Product, variant?: ProductVariant): string | null {
  const value = product.purityValue ?? variant?.purityScore;
  if (value === undefined || value === null) return null;
  if (product.analyticalDataSource === 'UNAVAILABLE' && product.documentationStatus === 'NO_DOCUMENTATION') {
    return null;
  }
  return `${Number(value).toFixed(2)}% HPLC (documented)`;
}
