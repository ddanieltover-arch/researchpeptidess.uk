import { TestResult } from '../commerce-tests';
import { Order, Payment, NotificationType } from '../../types';
import { escapeHtml } from './escape';
import { isSafeEmailHref } from './brand';
import {
  inferOrderNotificationType,
  renderAccountEmail,
  renderContactEmail,
  renderNewsletterEmail,
  renderOrderEmail,
} from './templates';

function run(
  name: string,
  testFn: () => { passed: boolean; expected: string; actual: string }
): TestResult {
  const start = performance.now();
  try {
    const outcome = testFn();
    return {
      category: 'EMAIL',
      name,
      passed: outcome.passed,
      expected: outcome.expected,
      actual: outcome.actual,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    };
  } catch (err: unknown) {
    return {
      category: 'EMAIL',
      name,
      passed: false,
      expected: 'Successful execution',
      actual: `Exception: ${err instanceof Error ? err.message : String(err)}`,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Math.round((performance.now() - start) * 100) / 100,
    };
  }
}

function sampleOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'ord-email-1',
    orderNumber: 'RP-UK-100001',
    customerEmail: 'lab@example.ac.uk',
    customerName: 'Dr Example',
    shippingAddress: {
      fullName: 'Dr Example',
      institution: 'Example University',
      addressLine1: '1 Laboratory Road',
      city: 'Cambridge',
      postcode: 'CB2 1TN',
      country: 'GB',
      countryName: 'United Kingdom',
      phone: '01223 000000',
      email: 'lab@example.ac.uk',
    },
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        variantId: 'var-1',
        productName: 'BPC-157',
        variantName: '5mg vial',
        sku: 'BPC-5',
        variantSku: 'BPC-5',
        size: '5mg',
        quantity: 2,
        unitPrice: 40,
        tierDiscountAmount: 0,
        allocatedCouponDiscountAmount: 0,
        allocatedCryptoDiscountAmount: 0,
        totalPrice: 80,
      },
    ],
    subtotal: 80,
    tierDiscountAmount: 0,
    couponDiscountAmount: 0,
    cryptoDiscountAmount: 0,
    shippingMethodId: 'uk-tracked',
    shippingMethodName: 'UK Tracked',
    shippingCarrier: 'Royal Mail',
    shippingZone: 'UK_MAINLAND',
    shippingFee: 0,
    total: 80,
    currency: 'GBP',
    status: 'PENDING_PAYMENT',
    paymentId: 'pay-1',
    paymentStatus: 'UNPAID',
    paymentMethod: 'BANK_TRANSFER',
    history: [],
    researchConsentSigned: true,
    createdAt: '2026-08-25T09:00:00.000Z',
    updatedAt: '2026-08-25T09:00:00.000Z',
    ...overrides,
  };
}

function samplePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: 'pay-1',
    orderId: 'ord-email-1',
    orderNumber: 'RP-UK-100001',
    method: 'BANK_TRANSFER',
    amount: 80,
    currency: 'GBP',
    status: 'UNPAID',
    reference: 'RP-UK-100001',
    createdAt: '2026-08-25T09:00:00.000Z',
    updatedAt: '2026-08-25T09:00:00.000Z',
    ...overrides,
  };
}

const ORDER_TYPES: NotificationType[] = [
  'ORDER_RECEIVED',
  'PAYMENT_INSTRUCTIONS',
  'PAYMENT_SUBMITTED',
  'PAYMENT_VERIFIED',
  'PAYMENT_REJECTED',
  'ORDER_PROCESSING',
  'ORDER_SHIPPED',
  'ORDER_DELIVERED',
  'ORDER_CANCELLED',
  'REFUND_PROCESSED',
];

export function runEmailTests(): TestResult[] {
  const order = sampleOrder();
  const payment = samplePayment();

  return [
    run('HTML escaping strips script tags from user input', () => {
      const escaped = escapeHtml('</h1><script>alert(1)</script>');
      const passed = escaped === '&lt;/h1&gt;&lt;script&gt;alert(1)&lt;/script&gt;';
      return { passed, expected: 'escaped markup', actual: escaped };
    }),
    run('Contact customer and admin templates both render', () => {
      const payload = {
        id: 'enq_1',
        name: 'Dr <Example>',
        email: 'lab@example.ac.uk',
        subject: 'HPLC query',
        message: 'Please advise on <batch> documentation.',
        createdAt: '2026-08-25T09:00:00.000Z',
      };
      const customer = renderContactEmail('customer', payload);
      const admin = renderContactEmail('admin', payload);
      const passed =
        customer.html.includes('Research Peptides') &&
        admin.html.includes('Operations') &&
        !customer.html.includes('<batch>') &&
        customer.html.includes('&lt;batch&gt;') &&
        admin.subject.includes('New enquiry');
      return {
        passed,
        expected: 'branded customer + admin contact HTML with escaped message',
        actual: passed ? 'rendered' : `c=${customer.subject} a=${admin.subject}`,
      };
    }),
    run('Newsletter and account forms render customer and admin copies', () => {
      const newsletterCustomer = renderNewsletterEmail('customer', {
        email: 'lab@example.ac.uk',
        topics: ['NEW_CATALOGUE', 'DOCUMENTATION'],
        created: true,
      });
      const newsletterAdmin = renderNewsletterEmail('admin', {
        email: 'lab@example.ac.uk',
        topics: ['NEW_CATALOGUE'],
        created: true,
      });
      const accountCustomer = renderAccountEmail('customer', {
        name: 'Dr Example',
        email: 'lab@example.ac.uk',
        institution: 'Example University',
      });
      const accountAdmin = renderAccountEmail('admin', {
        name: 'Dr Example',
        email: 'lab@example.ac.uk',
      });
      const passed =
        newsletterCustomer.html.includes('Subscription confirmed') &&
        newsletterAdmin.html.includes('consented subscription') &&
        accountCustomer.html.includes('Welcome') &&
        accountAdmin.subject.includes('New laboratory account');
      return { passed, expected: 'four form variants', actual: passed ? 'rendered' : 'missing copy' };
    }),
    run('Every order notification has customer and admin HTML', () => {
      const missing: string[] = [];
      for (const type of ORDER_TYPES) {
        const customer = renderOrderEmail(type, 'customer', order, payment);
        const admin = renderOrderEmail(type, 'admin', order, payment);
        if (!customer.html.includes('RP-UK-100001') || !admin.html.includes('RP-UK-100001')) {
          missing.push(type);
        }
        if (!customer.html.includes('BPC-157') || !admin.subject.includes('RP-UK')) {
          missing.push(`${type}:content`);
        }
      }
      return {
        passed: missing.length === 0,
        expected: `${ORDER_TYPES.length} customer + admin order templates`,
        actual: missing.length === 0 ? `rendered ${ORDER_TYPES.length}` : missing.join(', '),
      };
    }),
    run('Unsafe tracking URLs are rejected', () => {
      const safe = isSafeEmailHref('https://researchpeptidess.uk/account');
      const unsafe = isSafeEmailHref('javascript:alert(1)');
      return {
        passed: safe && !unsafe,
        expected: 'https allowed, javascript rejected',
        actual: `safe=${safe} unsafe=${unsafe}`,
      };
    }),
    run('Shipped emails include tracking when present', () => {
      const shipped = renderOrderEmail(
        'ORDER_SHIPPED',
        'customer',
        sampleOrder({
          status: 'SHIPPED',
          trackingNumber: 'AB123456789GB',
          courier: 'Royal Mail Tracked 24',
        }),
        payment
      );
      const passed = shipped.html.includes('AB123456789GB') && shipped.html.includes('Royal Mail Tracked 24');
      return { passed, expected: 'tracking number in HTML', actual: passed ? 'present' : 'missing' };
    }),
    run('Payment rejection reason is escaped', () => {
      const rendered = renderOrderEmail(
        'PAYMENT_REJECTED',
        'customer',
        order,
        samplePayment({ status: 'FAILED', rejectionReason: '<img src=x onerror=alert(1)>' })
      );
      const passed = !rendered.html.includes('<img src=x') && rendered.html.includes('&lt;img src=x');
      return { passed, expected: 'escaped rejection reason', actual: passed ? 'escaped' : 'unsafe' };
    }),
    run('Infer notification type from verified order status', () => {
      const type = inferOrderNotificationType(sampleOrder({ status: 'PAYMENT_VERIFIED', paymentStatus: 'VERIFIED' }));
      return { passed: type === 'PAYMENT_VERIFIED', expected: 'PAYMENT_VERIFIED', actual: String(type) };
    }),
  ];
}
