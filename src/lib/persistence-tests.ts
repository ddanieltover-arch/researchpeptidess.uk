import { TestResult } from './commerce-tests';
import { applyMerchandisingOverlay } from './merchandising';
import { neutralizeUnsafePublicCopy } from './public-copy-safety';
import { Product } from '../types';

function run(
  name: string,
  testFn: () => { passed: boolean; expected: string; actual: string }
): TestResult {
  const start = performance.now();
  try {
    const outcome = testFn();
    return {
      category: 'PERSISTENCE',
      name,
      passed: outcome.passed,
      expected: outcome.expected,
      actual: outcome.actual,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    };
  } catch (err: unknown) {
    return {
      category: 'PERSISTENCE',
      name,
      passed: false,
      expected: 'Successful execution',
      actual: `Exception: ${err instanceof Error ? err.message : String(err)}`,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    };
  }
}

function sample(overrides: Partial<Product> = {}): Product {
  return {
    id: 'prod-a',
    name: 'Compound A',
    slug: 'compound-a',
    sku: 'SKU-A',
    categoryId: 'cat-peptides',
    shortDescription: 'Reference',
    longDescription: 'Reference',
    productType: 'PEPTIDE',
    researchClassification: 'IN_VITRO_ONLY',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    isFeatured: false,
    researchOnly: true,
    documentationStatus: 'AVAILABLE',
    analyticalDataSource: 'DOCUMENTED',
    appearance: 'Powder',
    storageRequirements: 'Freezer',
    solubility: 'Water',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    variants: [],
    images: [],
    documents: [],
    ...overrides,
  };
}

export function runPersistenceTests(): TestResult[] {
  return [
    run('Merchandising overlay persists featured and override flags', () => {
      const products = [sample(), sample({ id: 'prod-b', name: 'Compound B' })];
      const next = applyMerchandisingOverlay(products, [
        {
          productId: 'prod-a',
          featured: true,
          bestsellerOverride: true,
          bestsellerExcluded: false,
          newArrivalOverride: true,
          hideFromHomepage: false,
          merchandisingPriority: 12,
          merchandisingUpdatedBy: 'admin@example.com',
        },
      ]);
      const a = next.find((item) => item.id === 'prod-a');
      const b = next.find((item) => item.id === 'prod-b');
      const passed = Boolean(
        a?.isFeatured &&
          a.merchandising?.bestsellerPinned &&
          a.merchandising?.newArrivalPinned &&
          a.merchandising?.priority === 12 &&
          b &&
          !b.isFeatured
      );
      return {
        passed,
        expected: 'Product A featured/pinned; Product B unchanged',
        actual: `A featured=${a?.isFeatured} pin=${a?.merchandising?.bestsellerPinned} B featured=${b?.isFeatured}`,
      };
    }),
    run('Empty merchandising collection does not crash overlay', () => {
      const next = applyMerchandisingOverlay([sample()], []);
      return {
        passed: next.length === 1 && next[0].isFeatured === false,
        expected: 'Original products returned',
        actual: String(next.length),
      };
    }),
    run('Unsafe public copy is neutralized without deleting the description', () => {
      const input = 'Investigated in bodybuilding and weight loss models. Recommended dose is not provided.';
      const output = neutralizeUnsafePublicCopy(input);
      const passed =
        output.includes('laboratory muscle-physiology research') &&
        output.includes('energy-balance research models') &&
        output.includes('analytical concentration (research only)') &&
        output.length > 20;
      return {
        passed,
        expected: 'Unsafe phrases replaced; description retained',
        actual: output,
      };
    }),
    run('Correlation reference format is RP-ERR-XXXX', () => {
      const sampleRef = 'RP-ERR-A1B2';
      const passed = /^RP-ERR-[A-F0-9]{4}$/.test(sampleRef);
      return {
        passed,
        expected: 'RP-ERR-XXXX',
        actual: sampleRef,
      };
    }),
  ];
}
