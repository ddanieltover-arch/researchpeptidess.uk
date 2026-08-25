import { Order, Product } from '../types';
import { isPublicCatalogueProduct } from './merchandising';
import { formatProductDisplayName } from './product-display';
import { productPath, type RouteKind } from './routing';

const COMPLETED_ORDER_STATUSES = new Set([
  'PAYMENT_VERIFIED',
  'PROCESSING',
  'PARTIALLY_FULFILLED',
  'SHIPPED',
  'DELIVERED',
]);

const RECENT_ORDER_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const CATALOGUE_FEED_LIMIT = 8;
const TITLE_PREFIX = /^(dr|prof|mr|mrs|ms|miss|sir|dame)\.?$/i;

export const PREFERRED_PURCHASE_NOTICE_SLUG = 'bacteriostatic-water-0-9-sodium-chloride';

const CATALOGUE_BUYERS = ['Nathan D', 'Elena D', 'James M', 'Sophie K', 'Oliver P', 'Amira H', 'Thomas R', 'Chloe W'];
const CATALOGUE_MINUTES_AGO = [780, 42, 5, 180, 22, 960, 8, 360];
const CATALOGUE_EXTRA_COUNTS = [3, 0, 2, 1, 0, 4, 0, 1];

export const HIDDEN_PURCHASE_NOTICE_ROUTES: ReadonlySet<RouteKind> = new Set([
  'admin',
  'admin-login',
  'checkout',
  'account-login',
]);

export interface PurchaseNotice {
  id: string;
  buyerLabel: string;
  productId: string;
  productName: string;
  productSlug: string;
  imageUrl: string;
  imageAlt: string;
  extraProductCount: number;
  minutesAgo: number;
  href: string;
}

export function shouldShowPurchaseNotifications(kind: RouteKind): boolean {
  return !HIDDEN_PURCHASE_NOTICE_ROUTES.has(kind);
}

export function formatBuyerLabel(fullName: string): string {
  const withoutCredentials = String(fullName || '')
    .split(',')[0]
    .trim();
  const parts = withoutCredentials.split(/\s+/).filter(Boolean);
  const names = parts.filter((part) => !TITLE_PREFIX.test(part));
  if (names.length === 0) return 'A researcher';
  const first = names[0];
  const last = names[names.length - 1];
  if (!last || last === first) return first;
  return `${first} ${last.charAt(0).toUpperCase()}`;
}

export function formatRelativeMinutesAgo(minutesAgo: number): string {
  const minutes = Math.max(0, Math.floor(Number(minutesAgo) || 0));
  if (minutes < 1) return 'Just now';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export function formatPurchaseProductLabel(productName: string, extraProductCount = 0): string {
  const name = formatProductDisplayName(productName || '');
  const extra = Math.max(0, Math.floor(Number(extraProductCount) || 0));
  if (extra <= 0) return name;
  return `${name} & ${extra} more product${extra === 1 ? '' : 's'}`;
}

function toNotice(params: {
  id: string;
  buyerLabel: string;
  product: Product;
  extraProductCount: number;
  minutesAgo: number;
}): PurchaseNotice {
  const image =
    params.product.images?.find((item) => item.isPrimary) || params.product.images?.[0];
  const productName = formatProductDisplayName(params.product.name || '');
  return {
    id: params.id,
    buyerLabel: params.buyerLabel,
    productId: params.product.id,
    productName,
    productSlug: params.product.slug,
    imageUrl: image?.url || '',
    imageAlt: image?.altText || productName,
    extraProductCount: params.extraProductCount,
    minutesAgo: params.minutesAgo,
    href: productPath(params.product.slug),
  };
}

function noticesFromRecentOrders(products: Product[], orders: Order[], now: number): PurchaseNotice[] {
  const byId = new Map((products || []).map((product) => [product.id, product]));
  const notices: PurchaseNotice[] = [];

  for (const order of orders || []) {
    if (!COMPLETED_ORDER_STATUSES.has(order.status)) continue;
    const created = Date.parse(order.createdAt);
    if (!Number.isFinite(created)) continue;
    const age = now - created;
    if (age < 0 || age > RECENT_ORDER_WINDOW_MS) continue;

    const items = order.items || [];
    const uniqueIds = [...new Set(items.map((item) => item.productId).filter(Boolean))];
    const product = byId.get(uniqueIds[0] || '');
    if (!product || !isPublicCatalogueProduct(product)) continue;

    notices.push(
      toNotice({
        id: `order-${order.id}`,
        buyerLabel: formatBuyerLabel(order.customerName),
        product,
        extraProductCount: Math.max(0, uniqueIds.length - 1),
        minutesAgo: Math.floor(age / 60000),
      })
    );
  }

  return notices.sort((a, b) => a.minutesAgo - b.minutesAgo);
}

export function buildCataloguePurchaseFeed(products: Product[]): PurchaseNotice[] {
  const published = (products || []).filter(isPublicCatalogueProduct);
  if (published.length === 0) return [];

  const preferred = published.find((product) => product.slug === PREFERRED_PURCHASE_NOTICE_SLUG);
  const featured = published.filter((product) => product.isFeatured && product.id !== preferred?.id);
  const remainder = published.filter(
    (product) => product.id !== preferred?.id && !product.isFeatured
  );
  const ordered = [...(preferred ? [preferred] : []), ...featured, ...remainder].slice(
    0,
    CATALOGUE_FEED_LIMIT
  );

  return ordered.map((product, index) =>
    toNotice({
      id: `catalogue-${product.id}`,
      buyerLabel: CATALOGUE_BUYERS[index % CATALOGUE_BUYERS.length],
      product,
      extraProductCount: CATALOGUE_EXTRA_COUNTS[index % CATALOGUE_EXTRA_COUNTS.length],
      minutesAgo: CATALOGUE_MINUTES_AGO[index % CATALOGUE_MINUTES_AGO.length],
    })
  );
}

export function buildPurchaseNotificationFeed(
  products: Product[],
  orders: Order[] = [],
  now = Date.now()
): PurchaseNotice[] {
  const fromOrders = noticesFromRecentOrders(products, orders, now);
  if (fromOrders.length > 0) return fromOrders;
  return buildCataloguePurchaseFeed(products);
}
