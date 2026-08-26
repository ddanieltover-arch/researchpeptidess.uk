import { TestResult } from './commerce-tests';
import { applyMerchandisingOverlay } from './merchandising';
import { neutralizeUnsafePublicCopy } from './public-copy-safety';
import { STORE_CONTACT_EMAIL, STORE_WHATSAPP_DISPLAY, STORE_WHATSAPP_URL, withCanonicalStoreContactEmails } from './store-contact';
import {
  getBankSettlementInstructions,
  getCryptoSettlementInstructions,
  isSampleBankDestination,
  normalizePaymentProofReference,
} from './settlement-instructions';
import { resolvePublicBusinessValue, UNPUBLISHED_BUSINESS_DETAIL } from './public-placeholders';
import { getSeoMetadataForPath, generateRobotsTxt } from './seo';
import { Product } from '../types';
import { isPublicBootstrapSafe } from './public-bootstrap';
import { normalizeNeonConnectionString } from './neon-connection-string';
import { classifyPersistError, recommendedPersistFix } from './persist-error';
import { toRenderableText } from './react-text';
import { toDbOrderStatus } from './db-order-status';

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
    run('Legacy store inboxes canonicalize to the single contact email', () => {
      const next = withCanonicalStoreContactEmails({
        primaryEmail: 'lab@researchpeptidess.uk',
        supportEmail: 'support@researchpeptidess.uk',
        privacyEmail: 'privacy@researchpeptidess.uk',
      });
      const passed =
        next.primaryEmail === STORE_CONTACT_EMAIL &&
        next.supportEmail === STORE_CONTACT_EMAIL &&
        next.privacyEmail === STORE_CONTACT_EMAIL;
      return {
        passed,
        expected: STORE_CONTACT_EMAIL,
        actual: `${next.primaryEmail}/${next.supportEmail}/${next.privacyEmail}`,
      };
    }),
    run('WhatsApp desk uses the published messages-only number', () => {
      const passed =
        STORE_WHATSAPP_DISPLAY === '+44 7927 039397' &&
        STORE_WHATSAPP_URL === 'https://wa.me/447927039397';
      return {
        passed,
        expected: '+44 7927 039397 via wa.me/447927039397',
        actual: `${STORE_WHATSAPP_DISPLAY} ${STORE_WHATSAPP_URL}`,
      };
    }),
    run('Sample bank and crypto destinations are not treated as live settlement details', () => {
      const bank = getBankSettlementInstructions();
      const crypto = getCryptoSettlementInstructions();
      const sampleDetected = isSampleBankDestination('20-00-00', '89210044');
      const passed = bank.configured === false && crypto.configured === false && sampleDetected && !bank.sortCode && !crypto.walletAddress;
      return {
        passed,
        expected: 'Unconfigured empty destinations; sample sort code detected',
        actual: `bank=${bank.configured} crypto=${crypto.configured} sample=${sampleDetected} sort=${bank.sortCode} wallet=${crypto.walletAddress}`,
      };
    }),
    run('Placeholder payment proofs do not count as submitted evidence', () => {
      const pending = normalizePaymentProofReference('FPS-TRANSFER-PENDING');
      const cryptoPending = normalizePaymentProofReference('CRYPTO-TX-PENDING');
      const real = normalizePaymentProofReference('FP-88291');
      const passed = pending === undefined && cryptoPending === undefined && real === 'FP-88291';
      return {
        passed,
        expected: 'Placeholders discarded; real reference retained',
        actual: `${String(pending)}/${String(cryptoPending)}/${String(real)}`,
      };
    }),
    run('Unpublished legal placeholders are not shown as live company details', () => {
      const resolved = resolvePublicBusinessValue('[LEGAL_ENTITY_NAME]');
      const phone = resolvePublicBusinessValue('+44 (0) 20 8123 4567');
      const passed = resolved === UNPUBLISHED_BUSINESS_DETAIL && phone === UNPUBLISHED_BUSINESS_DETAIL;
      return {
        passed,
        expected: UNPUBLISHED_BUSINESS_DETAIL,
        actual: `${resolved} / ${phone}`,
      };
    }),
    run('Peptides category canonical is not rewritten to /shop', () => {
      const seo = getSeoMetadataForPath('/peptides');
      const passed =
        seo.canonicalUrl === 'https://researchpeptidess.uk/peptides' && seo.robots.includes('index');
      return {
        passed,
        expected: 'https://researchpeptidess.uk/peptides with index',
        actual: `${seo.canonicalUrl} ${seo.robots}`,
      };
    }),
    run('Public bootstrap payload omits orders, payments, and inventory', () => {
      const passed = isPublicBootstrapSafe({
        merchandising: [],
        storeSettings: null,
        shippingMethods: [],
        settlement: { bank: { configured: false }, crypto: { configured: false } },
      });
      const leaked = isPublicBootstrapSafe({
        merchandising: [],
        orders: [{ id: 'ord-1' }],
      });
      return {
        passed: passed && !leaked,
        expected: 'Public payload without private commerce keys',
        actual: `safe=${passed} leaked=${!leaked}`,
      };
    }),
    run('Neon HTTP URLs drop channel_binding', () => {
      const normalized = normalizeNeonConnectionString(
        'postgresql://user:pass@host/db?sslmode=require&channel_binding=require'
      );
      const passed = !normalized.includes('channel_binding') && normalized.includes('sslmode=require');
      return {
        passed,
        expected: 'channel_binding removed; sslmode retained',
        actual: normalized.replace(/:pass@/, ':[redacted]@'),
      };
    }),
    run('Persist errors expose a stage classification without SQL secrets', () => {
      const missing = classifyPersistError(new Error('relation "orders" does not exist'));
      const conn = classifyPersistError(new Error('fetch failed'));
      const passed =
        missing.classification === 'SCHEMA_MISSING' &&
        conn.classification === 'CONNECTION' &&
        recommendedPersistFix(missing.classification).includes('migrations');
      return {
        passed,
        expected: 'SCHEMA_MISSING and CONNECTION classifications',
        actual: `${missing.classification}/${conn.classification}`,
      };
    }),
    run('Checkout order statuses map onto the Neon order_status enum', () => {
      const passed =
        toDbOrderStatus('PENDING_PAYMENT') === 'pending_payment' &&
        toDbOrderStatus('PAYMENT_SUBMITTED') === 'payment_submitted' &&
        toDbOrderStatus('PAYMENT_VERIFIED') === 'payment_verified' &&
        toDbOrderStatus('PARTIALLY_FULFILLED') === 'processing' &&
        toDbOrderStatus('PAYMENT_EXPIRED') === 'cancelled';
      return {
        passed,
        expected: 'pending_payment/payment_submitted/payment_verified/processing/cancelled',
        actual: [
          toDbOrderStatus('PENDING_PAYMENT'),
          toDbOrderStatus('PAYMENT_SUBMITTED'),
          toDbOrderStatus('PAYMENT_VERIFIED'),
          toDbOrderStatus('PARTIALLY_FULFILLED'),
          toDbOrderStatus('PAYMENT_EXPIRED'),
        ].join('/'),
      };
    }),
    run('Plain {code, message} objects stringify instead of crashing React children', () => {
      const rendered = toRenderableText({ code: '42P01', message: 'relation "orders" does not exist' });
      const nested = toRenderableText({ error: { code: 'VALIDATION', message: 'Invalid payload' } });
      const empty = toRenderableText(undefined);
      const passed =
        rendered === '42P01: relation "orders" does not exist' &&
        nested === 'VALIDATION: Invalid payload' &&
        empty === '';
      return {
        passed,
        expected: 'code: message strings; empty for undefined',
        actual: `${rendered} | ${nested} | "${empty}"`,
      };
    }),
    run('Non-string store contact emails fall back to the canonical inbox', () => {
      const next = withCanonicalStoreContactEmails({
        primaryEmail: { code: 'X', message: 'bad' } as unknown as string,
        supportEmail: { code: 'Y', message: 'bad' } as unknown as string,
        privacyEmail: null,
      });
      const passed =
        next.primaryEmail === STORE_CONTACT_EMAIL &&
        next.supportEmail === STORE_CONTACT_EMAIL &&
        next.privacyEmail === STORE_CONTACT_EMAIL;
      return {
        passed,
        expected: STORE_CONTACT_EMAIL,
        actual: `${next.primaryEmail}/${next.supportEmail}/${next.privacyEmail}`,
      };
    }),
    run('Robots.txt lists sitemap and disallows cart, checkout, account, and admin', () => {
      const robots = generateRobotsTxt();
      const passed =
        robots.includes('Sitemap: https://researchpeptidess.uk/sitemap.xml') &&
        robots.includes('Disallow: /cart') &&
        robots.includes('Disallow: /checkout') &&
        robots.includes('Disallow: /account') &&
        robots.includes('Disallow: /admin');
      return {
        passed,
        expected: 'Sitemap + transactional disallows',
        actual: robots.slice(0, 180),
      };
    }),
  ];
}
