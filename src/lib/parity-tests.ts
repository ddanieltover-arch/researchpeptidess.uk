import { TestResult } from './commerce-tests';
import { parseAppPath, categoryPath, canonicalizeLocation, ROUTES } from './routing';
import {
  formatProductPriceRange,
  getProductCardCta,
  hasSelectableOptions,
} from './product-display';
import { getBestsellerEntries } from './merchandising';
import { productMatchesQuery, searchCatalogueProducts } from './catalogue-search';
import { getStorefrontTrustMetrics } from './trust-metrics';
import { subscribeToResearchUpdates } from './newsletter';
import { getCartCrossSellProducts, getRelatedProducts } from './related-products';
import {
  buildCataloguePurchaseFeed,
  buildPurchaseNotificationFeed,
  formatBuyerLabel,
  formatPurchaseProductLabel,
  formatRelativeMinutesAgo,
  shouldShowPurchaseNotifications,
} from './purchase-notifications';
import { withPurchasableCatalogueStock } from './catalogue-stock';
import { INITIAL_ORDERS, INITIAL_SHIPPING_METHODS, INITIAL_PRODUCTS } from './mock-data';
import { INITIAL_CATEGORIES } from './data/categories';
import { Product, ProductCategory, Order } from '../types';

function run(
  name: string,
  testFn: () => { passed: boolean; expected: string; actual: string }
): TestResult {
  const start = performance.now();
  try {
    const outcome = testFn();
    return {
      category: 'PARITY',
      name,
      passed: outcome.passed,
      expected: outcome.expected,
      actual: outcome.actual,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    };
  } catch (err: unknown) {
    return {
      category: 'PARITY',
      name,
      passed: false,
      expected: 'Successful execution',
      actual: `Exception: ${err instanceof Error ? err.message : String(err)}`,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    };
  }
}

function sampleProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p-test',
    name: 'BPC-157',
    slug: 'bpc-157',
    sku: 'RPUK-BPC',
    categoryId: 'cat-peptides',
    categoryName: 'Peptides',
    shortDescription: 'Reference listing',
    longDescription: 'Reference listing',
    productType: 'PEPTIDE',
    researchClassification: 'IN_VITRO_ONLY',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    isFeatured: false,
    researchOnly: true,
    documentationStatus: 'AVAILABLE',
    analyticalDataSource: 'DOCUMENTED',
    appearance: 'Lyophilized White Powder',
    storageRequirements: 'Store sealed at -20°C',
    solubility: 'Sterile water',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    variants: [
      {
        id: 'v1',
        productId: 'p-test',
        name: '5mg',
        size: '5mg',
        sku: 'RPUK-BPC-5',
        price: 15.99,
        stock: 10,
        lowStockThreshold: 2,
        status: 'ACTIVE',
      },
      {
        id: 'v2',
        productId: 'p-test',
        name: '10mg',
        size: '10mg',
        sku: 'RPUK-BPC-10',
        price: 29,
        stock: 4,
        lowStockThreshold: 2,
        status: 'ACTIVE',
      },
    ],
    images: [],
    documents: [],
    ...overrides,
  };
}

export function runParityTests(): TestResult[] {
  const results: TestResult[] = [];

  results.push(
    run('First-class /peptides route resolves to peptides category', () => {
      const parsed = parseAppPath('/peptides');
      return {
        passed: parsed.kind === 'category' && parsed.slug === 'peptides-for-sale-online',
        expected: 'kind=category slug=peptides-for-sale-online',
        actual: `kind=${parsed.kind} slug=${parsed.slug}`,
      };
    })
  );

  results.push(
    run('First-class /research-chemicals route is a category collection', () => {
      const parsed = parseAppPath('/research-chemicals');
      return {
        passed: parsed.kind === 'category' && parsed.slug === 'research-chemicals-to-buy',
        expected: 'kind=category slug=research-chemicals-to-buy',
        actual: `kind=${parsed.kind} slug=${parsed.slug}`,
      };
    })
  );

  results.push(
    run('Peptides public path is not /category/...', () => {
      const path = categoryPath('peptides-for-sale-online');
      return {
        passed: path === ROUTES.peptides,
        expected: ROUTES.peptides,
        actual: path,
      };
    })
  );

  results.push(
    run('Uncategorized URLs canonicalize onto peptides', () => {
      const result = canonicalizeLocation('/category/uncategorized');
      return {
        passed: result.href === ROUTES.peptides && result.didCanonicalize,
        expected: ROUTES.peptides,
        actual: result.href,
      };
    })
  );

  results.push(
    run('Catalogue has no Uncategorized category or products', () => {
      const hasCategory = INITIAL_CATEGORIES.some(
        (category) => category.slug === 'uncategorized' || category.id === 'cat-uncategorized'
      );
      const uncategorizedProducts = INITIAL_PRODUCTS.filter(
        (product) => product.categoryId === 'cat-uncategorized' || product.categoryName === 'Uncategorized'
      );
      return {
        passed: !hasCategory && uncategorizedProducts.length === 0,
        expected: 'No Uncategorized category or products',
        actual: `category=${hasCategory} products=${uncategorizedProducts.length}`,
      };
    })
  );

  results.push(
    run('Catalogue variants are in stock for purchase', () => {
      const unavailable = INITIAL_PRODUCTS.flatMap((product) =>
        (product.variants || []).filter(
          (variant) => variant.stock <= 0 || variant.status === 'OUT_OF_STOCK'
        )
      );
      const restored = withPurchasableCatalogueStock(
        sampleProduct({
          status: 'OUT_OF_STOCK',
          variants: [
            {
              id: 'v-empty',
              productId: 'p-test',
              name: '1mg',
              size: '1mg',
              sku: 'RPUK-EMPTY-1',
              price: 79.99,
              stock: 0,
              lowStockThreshold: 2,
              status: 'OUT_OF_STOCK',
            },
          ],
        })
      );
      const passed =
        unavailable.length === 0 &&
        restored.status === 'PUBLISHED' &&
        restored.variants[0].stock > 0 &&
        restored.variants[0].status === 'ACTIVE';
      return {
        passed,
        expected: 'Every listed variant has stock and is ACTIVE',
        actual: `unavailable=${unavailable.length} restoredStock=${restored.variants[0].stock} restoredStatus=${restored.variants[0].status}`,
      };
    })
  );

  results.push(
    run('Multi-variant cards use Select options and a live price range', () => {
      const product = sampleProduct();
      return {
        passed:
          hasSelectableOptions(product) &&
          getProductCardCta(product) === 'SELECT_OPTIONS' &&
          formatProductPriceRange(product, 'GBP') === '£15.99 – £29.00',
        expected: 'SELECT_OPTIONS + £15.99 – £29.00',
        actual: `${getProductCardCta(product)} | ${formatProductPriceRange(product, 'GBP')}`,
      };
    })
  );

  results.push(
    run('Single-variant in-stock cards use Add to cart', () => {
      const product = sampleProduct({
        variants: [
          {
            id: 'v1',
            productId: 'p-test',
            name: '5mg',
            size: '5mg',
            sku: 'RPUK-BPC-5',
            price: 15.99,
            stock: 10,
            lowStockThreshold: 2,
            status: 'ACTIVE',
          },
        ],
      });
      return {
        passed: getProductCardCta(product) === 'ADD_TO_CART' && !hasSelectableOptions(product),
        expected: 'ADD_TO_CART',
        actual: getProductCardCta(product),
      };
    })
  );

  results.push(
    run('Bestsellers require completed-order sales data', () => {
      const sold = sampleProduct({ id: 'prod-bpc157' });
      const unsold = sampleProduct({ id: 'prod-unsold', name: 'Unsold', slug: 'unsold' });
      const entries = getBestsellerEntries([sold, unsold], INITIAL_ORDERS, 10);
      const includesSold = entries.some((entry) => entry.product.id === 'prod-bpc157' && entry.unitsSold > 0);
      const includesUnsold = entries.some((entry) => entry.product.id === 'prod-unsold');
      return {
        passed: includesSold && !includesUnsold,
        expected: 'BPC-157 included from orders; unsold excluded',
        actual: `sold=${includesSold} unsold=${includesUnsold} count=${entries.length}`,
      };
    })
  );

  results.push(
    run('Search matches name, SKU, CAS and category without invented synonyms', () => {
      const product = sampleProduct({ casNumber: '137525-51-0' });
      const skuHit = productMatchesQuery(product, 'RPUK-BPC-10', 'Peptides');
      const casHit = productMatchesQuery(product, '137525-51-0', 'Peptides');
      const synonymHit = productMatchesQuery(product, 'wolverine healing peptide', 'Peptides');
      const suggestions = searchCatalogueProducts([product], 'bpc', INITIAL_CATEGORIES, 5);
      return {
        passed: skuHit && casHit && !synonymHit && suggestions[0]?.directMatch === true,
        expected: 'SKU and CAS match; fabricated synonym does not',
        actual: `sku=${skuHit} cas=${casHit} synonym=${synonymHit} direct=${suggestions[0]?.directMatch}`,
      };
    })
  );

  results.push(
    run('Trust metrics only expose countable catalogue and shipping data', () => {
      const metrics = getStorefrontTrustMetrics(
        [sampleProduct(), sampleProduct({ id: 'p2', documentationStatus: 'NO_DOCUMENTATION', documents: [] })],
        INITIAL_CATEGORIES as ProductCategory[],
        INITIAL_SHIPPING_METHODS
      );
      const keys = Object.keys(metrics).sort().join(',');
      return {
        passed:
          keys === 'activeCategoryCount,activeShippingMethodCount,documentedProductCount,fulfilmentRegionCount,publishedProductCount' &&
          metrics.publishedProductCount === 2,
        expected: 'Five factual metric keys; publishedProductCount 2',
        actual: `${keys} count=${metrics.publishedProductCount}`,
      };
    })
  );

  results.push(
    run('Newsletter subscription requires consent', () => {
      const denied = subscribeToResearchUpdates({
        email: 'lab@example.ac.uk',
        topics: ['NEW_CATALOGUE'],
        marketingConsent: false,
      });
      const allowed = subscribeToResearchUpdates({
        email: 'lab@example.ac.uk',
        topics: ['NEW_CATALOGUE'],
        marketingConsent: true,
      });
      return {
        passed: denied.ok === false && allowed.ok === true,
        expected: 'Consent required; consented subscribe succeeds',
        actual: `denied=${denied.ok} allowed=${allowed.ok}`,
      };
    })
  );

  results.push(
    run('Related products stay within category or product type', () => {
      const current = sampleProduct();
      const sameCategory = sampleProduct({ id: 'rel-1', slug: 'rel-1', name: 'Related A' });
      const otherType = sampleProduct({
        id: 'rel-2',
        slug: 'rel-2',
        name: 'Solvent',
        categoryId: 'cat-reagents',
        productType: 'SOLVENT',
      });
      const related = getRelatedProducts(current, [current, sameCategory, otherType], 3);
      return {
        passed: related.some((item) => item.id === 'rel-1') && !related.some((item) => item.id === 'rel-2'),
        expected: 'Same category included; different type/category excluded when category matches exist',
        actual: related.map((item) => item.id).join(','),
      };
    })
  );

  results.push(
    run('Cart drawer cross-sell excludes items already in the basket', () => {
      const inCart = sampleProduct({ id: 'cart-item', slug: 'cart-item', name: 'In cart' });
      const related = sampleProduct({ id: 'rel-cart', slug: 'rel-cart', name: 'Suggested' });
      const alsoInCart = sampleProduct({ id: 'also-cart', slug: 'also-cart', name: 'Already added' });
      const suggestions = getCartCrossSellProducts(
        [inCart.id, alsoInCart.id],
        [inCart, related, alsoInCart],
        4
      );
      return {
        passed:
          suggestions.some((item) => item.id === 'rel-cart') &&
          !suggestions.some((item) => item.id === 'cart-item') &&
          !suggestions.some((item) => item.id === 'also-cart'),
        expected: 'Related catalogue items only; in-cart products omitted',
        actual: suggestions.map((item) => item.id).join(',') || 'none',
      };
    })
  );

  results.push(
    run('Completed-order merchandising ignores draft orders', () => {
      const draft: Order = {
        ...INITIAL_ORDERS[0],
        id: 'draft-order',
        status: 'DRAFT',
        items: [
          {
            ...INITIAL_ORDERS[0].items[0],
            id: 'draft-item',
            productId: 'prod-unsold-draft',
            quantity: 99,
          },
        ],
      };
      const entries = getBestsellerEntries(
        [sampleProduct({ id: 'prod-unsold-draft' })],
        [draft],
        5
      );
      return {
        passed: entries.length === 0,
        expected: 'No bestsellers from DRAFT orders',
        actual: String(entries.length),
      };
    })
  );

  results.push(
    run('Purchase notice copy anonymises names and formats relative time', () => {
      const label = formatBuyerLabel('Dr. Arthur Harrison');
      const hours = formatRelativeMinutesAgo(780);
      const extra = formatPurchaseProductLabel(
        'Bacteriostatic Water 0.9% Sodium Chloride 10mL – Hospira USP Injection',
        3
      );
      const passed =
        label === 'Arthur H' &&
        hours === '13 hours ago' &&
        extra.includes('& 3 more products');
      return {
        passed,
        expected: 'Arthur H / 13 hours ago / & 3 more products',
        actual: `${label} | ${hours} | ${extra}`,
      };
    })
  );

  results.push(
    run('Catalogue purchase feed prefers bacteriostatic water and is clickable', () => {
      const preferred = sampleProduct({
        id: 'prod-bac',
        name: 'Bacteriostatic Water 0.9% Sodium Chloride 10mL – Hospira USP Injection',
        slug: 'bacteriostatic-water-0-9-sodium-chloride',
      });
      const other = sampleProduct({
        id: 'prod-other',
        slug: 'other-peptide',
        name: 'Other Peptide',
        isFeatured: true,
      });
      const hidden = sampleProduct({
        id: 'prod-hidden',
        slug: 'hidden',
        name: 'Hidden',
        visibility: 'ADMIN_ONLY',
      });
      const feed = buildCataloguePurchaseFeed([hidden, other, preferred]);
      const first = feed[0];
      const passed = Boolean(
        first?.productSlug === 'bacteriostatic-water-0-9-sodium-chloride' &&
          first.buyerLabel === 'Nathan D' &&
          first.extraProductCount === 3 &&
          first.href === '/product/bacteriostatic-water-0-9-sodium-chloride' &&
          formatRelativeMinutesAgo(first.minutesAgo) === '13 hours ago' &&
          !feed.some((item) => item.productId === 'prod-hidden')
      );
      return {
        passed,
        expected: 'Nathan D, preferred slug, 13 hours ago, product href, private omitted',
        actual: `${first?.buyerLabel} ${first?.productSlug} ${first?.href} extra=${first?.extraProductCount} n=${feed.length}`,
      };
    })
  );

  results.push(
    run('Recent completed orders populate purchase notices; drafts do not', () => {
      const product = sampleProduct({ id: 'prod-live', slug: 'live-peptide', name: 'Live Peptide' });
      const now = Date.parse('2026-08-25T10:00:00.000Z');
      const recent: Order = {
        ...INITIAL_ORDERS[0],
        id: 'ord-recent',
        status: 'PAYMENT_VERIFIED',
        customerName: 'Nathan Drake',
        createdAt: '2026-08-24T21:00:00.000Z',
        items: [
          { ...INITIAL_ORDERS[0].items[0], productId: 'prod-live' },
          { ...INITIAL_ORDERS[0].items[1], productId: 'prod-extra' },
        ],
      };
      const draft: Order = { ...recent, id: 'ord-draft', status: 'DRAFT' };
      const old: Order = { ...recent, id: 'ord-old', createdAt: '2026-01-01T00:00:00.000Z' };
      const fromRecent = buildPurchaseNotificationFeed([product], [recent], now);
      const fromDraft = buildPurchaseNotificationFeed([product], [draft], now);
      const fromOld = buildPurchaseNotificationFeed([product], [old], now);
      const passed = Boolean(
        fromRecent[0]?.buyerLabel === 'Nathan D' &&
          fromRecent[0]?.href === '/product/live-peptide' &&
          fromRecent[0]?.extraProductCount === 1 &&
          fromDraft[0]?.id.startsWith('catalogue-') &&
          fromOld[0]?.id.startsWith('catalogue-')
      );
      return {
        passed,
        expected: 'Recent verified order becomes clickable notice; draft/old fall back to catalogue',
        actual: `recent=${fromRecent[0]?.id}/${fromRecent[0]?.buyerLabel} draft=${fromDraft[0]?.id} old=${fromOld[0]?.id}`,
      };
    })
  );

  results.push(
    run('Purchase notifications are hidden on checkout and admin routes', () => {
      const passed =
        shouldShowPurchaseNotifications('home') &&
        shouldShowPurchaseNotifications('product') &&
        !shouldShowPurchaseNotifications('checkout') &&
        !shouldShowPurchaseNotifications('admin') &&
        !shouldShowPurchaseNotifications('account-login');
      return {
        passed,
        expected: 'Visible on storefront; hidden on checkout/admin/login',
        actual: `home=${shouldShowPurchaseNotifications('home')} checkout=${shouldShowPurchaseNotifications('checkout')} admin=${shouldShowPurchaseNotifications('admin')}`,
      };
    })
  );

  return results;
}
