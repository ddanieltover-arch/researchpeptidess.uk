import type { Product } from '../../../types';
import catalog from './woocommerce-catalog.json';

export const WOOCOMMERCE_PRODUCTS = catalog.products as Product[];
export const SLUG_REDIRECTS = catalog.slugRedirects as Record<string, string>;
export const WC_SYNC_META = {
  generatedAt: catalog.generatedAt,
  sourceCount: catalog.sourceCount,
  matched: catalog.matched,
  created: catalog.created,
};
