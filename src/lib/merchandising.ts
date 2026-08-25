/**
 * Catalogue merchandising derived from completed orders, publication dates,
 * inventory restocks, and optional admin overrides.
 */

import { InventoryTransaction, Order, Product } from '../types';
import { MerchandisingRecord } from './merchandising-persistence';

const COMPLETED_ORDER_STATUSES = new Set([
  'PAYMENT_VERIFIED',
  'PROCESSING',
  'PARTIALLY_FULFILLED',
  'SHIPPED',
  'DELIVERED',
]);

const NEW_ARRIVAL_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const RESTOCK_WINDOW_MS = 21 * 24 * 60 * 60 * 1000;

export interface BestsellerEntry {
  product: Product;
  unitsSold: number;
  orderCount: number;
  score: number;
  pinned: boolean;
}

export function isPublicCatalogueProduct(product: Product | null | undefined): boolean {
  return Boolean(
    product &&
      product.visibility === 'PUBLIC' &&
      (product.status === 'PUBLISHED' || product.status === 'OUT_OF_STOCK')
  );
}

export function isStorefrontVisible(product: Product): boolean {
  return product.status === 'PUBLISHED' && product.visibility === 'PUBLIC' && !product.merchandising?.hideFromHomepage;
}

export function calculateBestsellerScores(orders: Order[]): Map<string, { unitsSold: number; orderCount: number; score: number }> {
  const scores = new Map<string, { unitsSold: number; orderCount: number; score: number }>();

  for (const order of orders || []) {
    if (!COMPLETED_ORDER_STATUSES.has(order.status)) continue;
    const counted = new Set<string>();
    for (const item of order.items || []) {
      const current = scores.get(item.productId) || { unitsSold: 0, orderCount: 0, score: 0 };
      current.unitsSold += item.quantity;
      if (!counted.has(item.productId)) {
        current.orderCount += 1;
        counted.add(item.productId);
      }
      current.score = current.unitsSold * 10 + current.orderCount;
      scores.set(item.productId, current);
    }
  }

  return scores;
}

export function getBestsellerEntries(products: Product[], orders: Order[], limit = 8): BestsellerEntry[] {
  const scores = calculateBestsellerScores(orders);
  const visible = products.filter(isStorefrontVisible);

  return visible
    .map((product) => {
      const stats = scores.get(product.id) || { unitsSold: 0, orderCount: 0, score: 0 };
      return {
        product,
        unitsSold: stats.unitsSold,
        orderCount: stats.orderCount,
        score: stats.score,
        pinned: Boolean(product.merchandising?.bestsellerPinned),
      };
    })
    .filter((entry) => {
      if (entry.product.merchandising?.excludeFromBestsellers) return false;
      // Never label or merchandise as a bestseller without supporting sales data.
      return entry.unitsSold > 0;
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.score - a.score;
    })
    .slice(0, limit);
}

export function applyMerchandisingOverlay(products: Product[], rows: MerchandisingRecord[]): Product[] {
  const map = new Map(rows.map((row) => [row.productId, row]));
  return products.map((product) => {
    const row = map.get(product.id);
    if (!row) return product;
    return {
      ...product,
      isFeatured: row.featured,
      merchandising: {
        bestsellerPinned: row.bestsellerOverride,
        excludeFromBestsellers: row.bestsellerExcluded,
        newArrivalPinned: row.newArrivalOverride,
        hideFromHomepage: row.hideFromHomepage,
        priority: row.merchandisingPriority,
        updatedAt: row.merchandisingUpdatedAt,
        updatedBy: row.merchandisingUpdatedBy || undefined,
      },
    };
  });
}

export function getFeaturedProducts(products: Product[], limit = 8): Product[] {
  return products
    .filter((product) => isStorefrontVisible(product) && product.isFeatured)
    .sort((a, b) => (b.merchandising?.priority || 0) - (a.merchandising?.priority || 0))
    .slice(0, limit);
}

export function getNewArrivalProducts(products: Product[], now = Date.now(), limit = 8): Product[] {
  return products
    .filter((product) => {
      if (!isStorefrontVisible(product)) return false;
      if (product.merchandising?.newArrivalPinned) return true;
      if (!product.publishedAt) return false;
      const stamp = Date.parse(product.publishedAt);
      if (Number.isNaN(stamp)) return false;
      return now - stamp <= NEW_ARRIVAL_WINDOW_MS;
    })
    .sort((a, b) => Date.parse(b.publishedAt || b.createdAt) - Date.parse(a.publishedAt || a.createdAt))
    .slice(0, limit);
}

export function getBackInStockProducts(
  products: Product[],
  transactions: InventoryTransaction[],
  now = Date.now(),
  limit = 8
): Product[] {
  const recentRestocks = new Set<string>();
  for (const transaction of transactions) {
    if (transaction.transactionType !== 'RESTOCK') continue;
    const stamp = Date.parse(transaction.createdAt);
    if (Number.isNaN(stamp) || now - stamp > RESTOCK_WINDOW_MS) continue;
    recentRestocks.add(transaction.variantId);
  }

  if (recentRestocks.size === 0) return [];

  return products
    .filter((product) => {
      if (!isStorefrontVisible(product)) return false;
      return (product.variants || []).some(
        (variant) => recentRestocks.has(variant.id) && variant.stock > 0
      );
    })
    .slice(0, limit);
}
