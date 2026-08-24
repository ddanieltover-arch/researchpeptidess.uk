import { TestResult } from './commerce-tests';
import { parseAppPath, categoryPath, ROUTES } from './routing';
import {
  formatProductPriceFrom,
  formatProductPriceRange,
  getProductCardCta,
  hasSelectableOptions,
} from './product-display';
import { getBestsellerEntries } from './merchandising';
import { productMatchesQuery, searchCatalogueProducts } from './catalogue-search';
import { getStorefrontTrustMetrics } from './trust-metrics';
import { subscribeToResearchUpdates } from './newsletter';
import { getRelatedProducts } from './related-products';
import { INITIAL_ORDERS, INITIAL_SHIPPING_METHODS } from './mock-data';
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
        passed: parsed.kind === 'category' && parsed.slug === 'peptides-and-analytical-standards',
        expected: 'kind=category slug=peptides-and-analytical-standards',
        actual: `kind=${parsed.kind} slug=${parsed.slug}`,
      };
    })
  );

  results.push(
    run('First-class /research-chemicals route is a category collection', () => {
      const parsed = parseAppPath('/research-chemicals');
      return {
        passed: parsed.kind === 'category' && parsed.slug === 'research-chemicals',
        expected: 'kind=category slug=research-chemicals',
        actual: `kind=${parsed.kind} slug=${parsed.slug}`,
      };
    })
  );

  results.push(
    run('Peptides public path is not /category/...', () => {
      const path = categoryPath('peptides-and-analytical-standards');
      return {
        passed: path === ROUTES.peptides,
        expected: ROUTES.peptides,
        actual: path,
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
          formatProductPriceFrom(product, 'GBP') === 'From £15.99' &&
          formatProductPriceRange(product, 'GBP') === '£15.99 – £29.00',
        expected: 'SELECT_OPTIONS + From £15.99 + £15.99 – £29.00',
        actual: `${getProductCardCta(product)} | ${formatProductPriceFrom(product, 'GBP')} | ${formatProductPriceRange(product, 'GBP')}`,
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

  return results;
}
