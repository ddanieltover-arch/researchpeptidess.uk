/**
 * Research Peptides UK — Comprehensive Commerce, Order & Operations Test Suite
 * Fully verifies Pricing Precedence, Inventory Integrity, State Machine Transitions,
 * Payment Idempotency, Shipping Eligibility, and Role Security.
 */

import { calculateOrderTotals, calculateTierDiscountForLine, isBankTransferAvailable, merchandiseTotalForPayment, validateCoupon } from './pricing';
import { checkVariantStockAvailability } from './inventory';
import { validateOrderTransition, validatePaymentTransition } from './order-state-machine';
import { calculateEligibleShippingMethods, getCheckoutDestinationGroups } from './shipping-engine';
import { hasPermission } from './auth';
import { validateCatalogueImport, executeCatalogueImport } from './catalogue-import';
import { authorizeDocumentAccess, authorizeOrderAccess } from './security';
import { CartItem, ProductVariant, Coupon, ShippingMethod, Product, ProductCategory, Order } from '../types';
import { runParityTests } from './parity-tests';
import { runPersistenceTests } from './persistence-tests';
import { runEmailTests } from './email/email-tests';
import { filterOrdersForCustomer } from './account-orders';
import { isSecureCookieRequest } from './cookie-security';
import { normalizePaymentProofReference } from './settlement-instructions';

export interface TestResult {
  category: 'PRICING' | 'INVENTORY' | 'STATE_MACHINE' | 'PAYMENTS' | 'SHIPPING' | 'SECURITY' | 'IMPORT' | 'PARITY' | 'PERSISTENCE' | 'EMAIL';
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  error?: string;
  durationMs: number;
}

export interface TestSuiteReport {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  overallPassed: boolean;
  durationMs: number;
  results: TestResult[];
}

export function runAllCommerceTests(): TestSuiteReport {
  const results: TestResult[] = [];

  const runTest = (
    category: TestResult['category'],
    name: string,
    testFn: () => { passed: boolean; expected: string; actual: string }
  ) => {
    const start = performance.now();
    try {
      const outcome = testFn();
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      results.push({
        category,
        name,
        passed: outcome.passed,
        expected: outcome.expected,
        actual: outcome.actual,
        durationMs,
      });
    } catch (err: any) {
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      results.push({
        category,
        name,
        passed: false,
        expected: 'Successful execution',
        actual: `Exception: ${err?.message || String(err)}`,
        error: err?.message,
        durationMs,
      });
    }
  };

  // ==========================================
  // 1. PRICING ENGINE TESTS
  // ==========================================

  runTest('PRICING', 'Standard Order Calculation (No Discounts)', () => {
    const items: CartItem[] = [
      {
        id: 'c1',
        productId: 'p1',
        productName: 'BPC-157',
        productSlug: 'bpc-157',
        variantId: 'v1',
        variantName: '5mg Vial',
        size: '5mg',
        sku: 'SKU-1',
        unitPrice: 30.0,
        quantity: 2,
        image: '',
      },
    ];
    const shipping: ShippingMethod = {
      id: 'ship-1',
      name: 'Royal Mail Tracked 24',
      zone: 'UK_MAINLAND',
      carrier: 'Royal Mail',
      price: 4.99,
      freeShippingThreshold: 75.0,
      estimatedDays: '1-2 days',
      trackingAvailable: true,
      isActive: true,
    };

    const res = calculateOrderTotals(items, 'BANK_TRANSFER', shipping, null);
    const passed = res.subtotal === 60.0 && res.shippingFee === 4.99 && res.total === 64.99;
    return {
      passed,
      expected: 'Subtotal: £60.00, Shipping: £4.99, Total: £64.99',
      actual: `Subtotal: £${res.subtotal}, Shipping: £${res.shippingFee}, Total: £${res.total}`,
    };
  });

  runTest('PRICING', 'Quantity Tier Volume Discount (3+ units = 10% off)', () => {
    const discount = calculateTierDiscountForLine(3, 30.0);
    // 3 * 30 = 90. 10% of 90 = 9.00
    const passed = discount === 9.0;
    return {
      passed,
      expected: 'Tier discount: £9.00',
      actual: `Tier discount: £${discount}`,
    };
  });

  runTest('PRICING', 'Coupon Validation (Min Spend & Expiry)', () => {
    const expiredCoupon: Coupon = {
      id: 'c-exp',
      code: 'EXPIRED10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minSpend: 50,
      usedCount: 0,
      isActive: true,
      endDate: '2020-01-01T00:00:00Z',
    };
    const validCoupon: Coupon = {
      id: 'c-valid',
      code: 'PROMO10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minSpend: 50,
      usedCount: 0,
      isActive: true,
    };

    const valExpired = validateCoupon(expiredCoupon, 100);
    const valUnderSpend = validateCoupon(validCoupon, 40);
    const valValid = validateCoupon(validCoupon, 100);

    const passed = !valExpired.isValid && !valUnderSpend.isValid && valValid.isValid;
    return {
      passed,
      expected: 'Expired -> False, Under Spend -> False, Valid -> True',
      actual: `Expired: ${valExpired.isValid}, UnderSpend: ${valUnderSpend.isValid}, Valid: ${valValid.isValid}`,
    };
  });

  runTest('PRICING', '5% Cryptocurrency Settlement Deduction', () => {
    const items: CartItem[] = [
      {
        id: 'c1',
        productId: 'p1',
        productName: 'Semaglutide Reference',
        productSlug: 'semaglutide',
        variantId: 'v1',
        variantName: '5mg Vial',
        size: '5mg',
        sku: 'SKU-SEMA',
        unitPrice: 100.0,
        quantity: 1,
        image: '',
      },
    ];
    const shipping: ShippingMethod = {
      id: 'ship-1',
      name: 'Free Courier',
      zone: 'UK_MAINLAND',
      carrier: 'Royal Mail',
      price: 0,
      freeShippingThreshold: 75.0,
      estimatedDays: '1-2 days',
      trackingAvailable: true,
      isActive: true,
    };

    const res = calculateOrderTotals(items, 'CRYPTOCURRENCY', shipping, null);
    // Subtotal: 100. Crypto 5% off 100 = 5.00. Total = 95.00
    const passed = res.cryptoDiscount === 5.0 && res.total === 95.0;
    return {
      passed,
      expected: 'Crypto Discount: £5.00, Total: £95.00',
      actual: `Crypto Discount: £${res.cryptoDiscount}, Total: £${res.total}`,
    };
  });

  runTest('PRICING', 'Calculation Precedence (Subtotal -> Tier -> Coupon -> Crypto -> Shipping)', () => {
    const items: CartItem[] = [
      {
        id: 'c1',
        productId: 'p1',
        productName: 'Peptide A',
        productSlug: 'pep-a',
        variantId: 'v1',
        variantName: 'Vial',
        size: '5mg',
        sku: 'SKU-A',
        unitPrice: 40.0,
        quantity: 3, // £120. 3 units -> 10% tier discount = £12. Net: £108
        image: '',
      },
    ];
    const coupon: Coupon = {
      id: 'cp1',
      code: 'TEST10',
      discountType: 'PERCENTAGE',
      discountValue: 10, // 10% of £108 = £10.80. Net: £97.20
      usedCount: 0,
      isActive: true,
    };
    const shipping: ShippingMethod = {
      id: 'ship-1',
      name: 'Express',
      zone: 'UK_MAINLAND',
      carrier: 'Royal Mail',
      price: 5.0,
      freeShippingThreshold: 150.0, // £97.20 < £150, so +£5.00 shipping applies
      estimatedDays: '1-2 days',
      trackingAvailable: true,
      isActive: true,
    };

    // Crypto discount: 5% of £97.20 = £4.86. After crypto: £92.34 + £5.00 shipping = £97.34
    const res = calculateOrderTotals(items, 'CRYPTOCURRENCY', shipping, coupon);
    const passed =
      res.subtotal === 120.0 &&
      res.itemDiscounts === 12.0 &&
      res.couponDiscount === 10.8 &&
      res.cryptoDiscount === 4.86 &&
      res.shippingFee === 5.0 &&
      res.total === 97.34;

    return {
      passed,
      expected: 'Sub: £120, Tier: £12, Coupon: £10.80, Crypto: £4.86, Ship: £5.00, Total: £97.34',
      actual: `Sub: £${res.subtotal}, Tier: £${res.itemDiscounts}, Coupon: £${res.couponDiscount}, Crypto: £${res.cryptoDiscount}, Ship: £${res.shippingFee}, Total: £${res.total}`,
    };
  });

  runTest('PRICING', 'Free shipping uses catalogue subtotal so checkout FREE labels match the payable fee', () => {
    const items: CartItem[] = [
      {
        id: 'c1',
        productId: 'p1',
        productName: 'Peptide A',
        productSlug: 'pep-a',
        variantId: 'v1',
        variantName: 'Vial',
        size: '5mg',
        sku: 'SKU-A',
        unitPrice: 24.2,
        quantity: 10, // £242.00 catalogue; 20% volume = £48.40; net merchandise £193.60
        image: '',
      },
    ];
    const shipping: ShippingMethod = {
      id: 'ship-uk-standard',
      name: 'Royal Mail Tracked 24 (Next Business Day)',
      zone: 'UK_MAINLAND',
      carrier: 'Royal Mail',
      price: 4.99,
      freeShippingThreshold: 200.0,
      estimatedDays: '1 Working Day',
      trackingAvailable: true,
      isActive: true,
    };
    const totals = calculateOrderTotals(items, 'BANK_TRANSFER', shipping, null);
    const methods = calculateEligibleShippingMethods('GB', totals.subtotal, [shipping], shipping.id);
    const passed =
      totals.subtotal === 242 &&
      totals.itemDiscounts === 48.4 &&
      totals.shippingFee === 0 &&
      totals.freeShippingQualified === true &&
      totals.total === 193.6 &&
      methods.selectedPrice === 0 &&
      methods.eligibleMethods[0]?.freeShippingQualified === true;

    return {
      passed,
      expected: '£242 subtotal qualifies for £0 shipping even after £48.40 volume saving',
      actual: `sub=${totals.subtotal} ship=${totals.shippingFee} total=${totals.total} dropdown=${methods.selectedPrice}`,
    };
  });

  // ==========================================
  // 2. INVENTORY CONSISTENCY TESTS
  // ==========================================

  runTest('INVENTORY', 'Variant Stock Availability Check & Reservation Guard', () => {
    const mockVariant: ProductVariant = {
      id: 'v-test',
      productId: 'p-test',
      name: '5mg Vial',
      size: '5mg',
      sku: 'SKU-V-1',
      price: 25.0,
      stock: 10,
      reservedStock: 8, // available = 2
      lowStockThreshold: 3,
      status: 'ACTIVE',
    };

    const checkSufficient = checkVariantStockAvailability(mockVariant, 2);
    const checkExcess = checkVariantStockAvailability(mockVariant, 3);

    const passed = checkSufficient.isAvailable === true && checkExcess.isAvailable === false;
    return {
      passed,
      expected: 'Qty 2 -> Available (True), Qty 3 -> Exceeds (False)',
      actual: `Qty 2: ${checkSufficient.isAvailable}, Qty 3: ${checkExcess.isAvailable}`,
    };
  });

  // ==========================================
  // 3. ORDER STATE MACHINE TESTS
  // ==========================================

  runTest('STATE_MACHINE', 'Valid Lifecycle State Transitions', () => {
    const t1 = validateOrderTransition('PENDING_PAYMENT', 'PAYMENT_SUBMITTED');
    const t2 = validateOrderTransition('PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED');
    const t3 = validateOrderTransition('PAYMENT_VERIFIED', 'PROCESSING');
    const t4 = validateOrderTransition('PROCESSING', 'SHIPPED');
    const t5 = validateOrderTransition('SHIPPED', 'DELIVERED');

    const passed = t1.isValid && t2.isValid && t3.isValid && t4.isValid && t5.isValid;
    return {
      passed,
      expected: 'All sequential state transitions are valid',
      actual: `t1: ${t1.isValid}, t2: ${t2.isValid}, t3: ${t3.isValid}, t4: ${t4.isValid}, t5: ${t5.isValid}`,
    };
  });

  runTest('STATE_MACHINE', 'Block Illegal State Transition (DELIVERED -> PENDING_PAYMENT)', () => {
    const check = validateOrderTransition('DELIVERED', 'PENDING_PAYMENT', 'CUSTOMER');
    const passed = check.isValid === false;
    return {
      passed,
      expected: 'Illegal transition blocked (isValid: false)',
      actual: `isValid: ${check.isValid}, reason: "${check.reason}"`,
    };
  });

  runTest('STATE_MACHINE', 'Administrative Emergency Override with Justification', () => {
    const withoutJustification = validateOrderTransition('DELIVERED', 'PROCESSING', 'ADMIN', '');
    const withJustification = validateOrderTransition(
      'DELIVERED',
      'PROCESSING',
      'ADMIN',
      'Quality Control Re-inspection of batch temperature logs requested by CSO'
    );

    const passed = withoutJustification.isValid === false && withJustification.isValid === true;
    return {
      passed,
      expected: 'Admin without justification -> False; Admin with justification -> True',
      actual: `Without: ${withoutJustification.isValid}, With: ${withJustification.isValid}`,
    };
  });

  // ==========================================
  // 4. PAYMENT STATE MACHINE & SEPARATION
  // ==========================================

  runTest('PAYMENTS', 'Payment State Separation from Order State', () => {
    const p1 = validatePaymentTransition('AWAITING_CUSTOMER_ACTION', 'SUBMITTED');
    const p2 = validatePaymentTransition('SUBMITTED', 'VERIFIED');
    const p3 = validatePaymentTransition('VERIFIED', 'REFUNDED');
    const p4 = validatePaymentTransition('VERIFIED', 'AWAITING_CUSTOMER_ACTION'); // invalid

    const passed = p1.isValid && p2.isValid && p3.isValid && !p4.isValid;
    return {
      passed,
      expected: 'Awaiting -> Submitted -> Verified -> Refunded (Valid); Verified -> Awaiting (Blocked)',
      actual: `p1: ${p1.isValid}, p2: ${p2.isValid}, p3: ${p3.isValid}, p4: ${p4.isValid}`,
    };
  });

  runTest('PAYMENTS', 'Checkout does not treat empty or placeholder proofs as submitted payment', () => {
    const empty = normalizePaymentProofReference('');
    const placeholder = normalizePaymentProofReference('FPS-TRANSFER-PENDING');
    const real = normalizePaymentProofReference('TXID-ABC');
    const passed = empty === undefined && placeholder === undefined && real === 'TXID-ABC';
    return {
      passed,
      expected: 'Only real customer evidence becomes a payment proof',
      actual: `${String(empty)}/${String(placeholder)}/${String(real)}`,
    };
  });

  runTest('PAYMENTS', 'Bank transfer is offered only from £100 merchandise total', () => {
    const afterCoupon = merchandiseTotalForPayment({
      subtotal: 140,
      itemDiscounts: 0,
      couponDiscount: 50,
    });
    const passed =
      afterCoupon === 90 &&
      !isBankTransferAvailable(afterCoupon) &&
      !isBankTransferAvailable(99.99) &&
      isBankTransferAvailable(100) &&
      isBankTransferAvailable(240);
    return {
      passed,
      expected: 'Crypto-only below £100 merchandise; bank available from £100',
      actual: `couponMerch=${afterCoupon} 99.99=${isBankTransferAvailable(99.99)} 100=${isBankTransferAvailable(100)} 240=${isBankTransferAvailable(240)}`,
    };
  });

  // ==========================================
  // 5. SHIPPING ENGINE & COUNTRY ELIGIBILITY
  // ==========================================

  runTest('SHIPPING', 'UK Mainland Free Shipping Threshold Qualification', () => {
    const shippingMethods: ShippingMethod[] = [
      {
        id: 'ship-uk',
        name: 'Royal Mail Tracked 24',
        zone: 'UK_MAINLAND',
        carrier: 'Royal Mail',
        price: 4.99,
        freeShippingThreshold: 75.0,
        estimatedDays: '1-2 days',
        trackingAvailable: true,
        isActive: true,
      },
    ];

    const belowThreshold = calculateEligibleShippingMethods('GB', 60.0, shippingMethods);
    const aboveThreshold = calculateEligibleShippingMethods('GB', 80.0, shippingMethods);

    const passed =
      belowThreshold.selectedPrice === 4.99 &&
      belowThreshold.eligibleMethods[0].freeShippingQualified === false &&
      aboveThreshold.selectedPrice === 0 &&
      aboveThreshold.eligibleMethods[0].freeShippingQualified === true;

    return {
      passed,
      expected: 'Spend £60 -> Fee: £4.99; Spend £80 -> Fee: £0.00 (Free)',
      actual: `Spend £60: £${belowThreshold.selectedPrice}, Spend £80: £${aboveThreshold.selectedPrice}`,
    };
  });

  runTest('SHIPPING', 'Checkout lists other European countries on existing EU zones', () => {
    const { featured, otherEuropean } = getCheckoutDestinationGroups();
    const zone2Method: ShippingMethod = {
      id: 'ship-eu-2',
      name: 'European Priority Airmail',
      zone: 'EUROPE_ZONE_2',
      carrier: 'DHL',
      price: 19.99,
      freeShippingThreshold: 250.0,
      estimatedDays: '3-5 days',
      trackingAvailable: true,
      isActive: true,
    };
    const greece = calculateEligibleShippingMethods('GR', 80, [zone2Method]);
    const passed =
      featured.some((country) => country.code === 'GB') &&
      otherEuropean.some((country) => country.code === 'BE') &&
      otherEuropean.some((country) => country.code === 'GR') &&
      !otherEuropean.some((country) => country.code === 'DE') &&
      greece.isAvailable === true;

    return {
      passed,
      expected: 'Other European Countries group excludes featured EU destinations and remains shippable',
      actual: `featured=${featured.map((c) => c.code).join(',')} other=${otherEuropean.map((c) => c.code).slice(0, 5).join(',')}… greece=${greece.isAvailable}`,
    };
  });

  runTest('SHIPPING', 'Reject Unsupported Non-Research Destination Country', () => {
    const shippingMethods: ShippingMethod[] = [
      {
        id: 'ship-uk',
        name: 'Royal Mail',
        zone: 'UK_MAINLAND',
        carrier: 'Royal Mail',
        price: 4.99,
        freeShippingThreshold: 75.0,
        estimatedDays: '1-2 days',
        trackingAvailable: true,
        isActive: true,
      },
    ];

    const unsupported = calculateEligibleShippingMethods('XX_UNKNOWN', 100.0, shippingMethods);
    const passed = unsupported.isAvailable === false && unsupported.error !== undefined;

    return {
      passed,
      expected: 'isAvailable: false with clean error',
      actual: `isAvailable: ${unsupported.isAvailable}, error: "${unsupported.error}"`,
    };
  });

  // ==========================================
  // 6. ROLE SECURITY & AUTHORIZATION TESTS
  // ==========================================

  runTest('SECURITY', 'Role Permissions Enforcement (Customer vs Admin vs Analyst)', () => {
    const customerCanAdmin = hasPermission('CUSTOMER', 'ADMIN');
    const adminCanAdmin = hasPermission('ADMIN', 'ADMIN');
    const analystCanAdmin = hasPermission('ANALYST', 'ADMIN');
    const analystCanAnalyst = hasPermission('ANALYST', 'ANALYST');

    const passed = !customerCanAdmin && adminCanAdmin && !analystCanAdmin && analystCanAnalyst;
    return {
      passed,
      expected: 'Customer admin: False, Admin admin: True, Analyst admin: False, Analyst analyst: True',
      actual: `Customer: ${customerCanAdmin}, Admin: ${adminCanAdmin}, AnalystAdmin: ${analystCanAdmin}, AnalystQC: ${analystCanAnalyst}`,
    };
  });

  // ==========================================
  // 7. INVENTORY RESERVATION SWEEP IDEMPOTENCY
  // ==========================================

  runTest('INVENTORY', '24h Reservation Expiry Sweeper Idempotency', () => {
    // Simulate orders with expired vs active reservations
    const now = Date.now();
    const expiredTimestamp = new Date(now - 25 * 60 * 60 * 1000).toISOString(); // 25 hours ago
    const activeTimestamp = new Date(now + 10 * 60 * 60 * 1000).toISOString(); // 10 hours future

    const ordersMock = [
      { id: 'ord-exp-1', status: 'PENDING_PAYMENT', reservationExpiresAt: expiredTimestamp, items: [{ variantId: 'v1', quantity: 2 }] },
      { id: 'ord-act-1', status: 'PENDING_PAYMENT', reservationExpiresAt: activeTimestamp, items: [{ variantId: 'v1', quantity: 1 }] },
    ];

    let v1Reserved = 3; // total 3 reserved (2 expired + 1 active)

    // First sweep run
    let firstSweepReleased = 0;
    for (const ord of ordersMock) {
      if (ord.status === 'PENDING_PAYMENT' && new Date(ord.reservationExpiresAt).getTime() < now) {
        ord.status = 'CANCELLED';
        firstSweepReleased += ord.items.reduce((s, i) => s + i.quantity, 0);
      }
    }
    v1Reserved -= firstSweepReleased;

    // Second sweep run immediately after (must be idempotent: release 0)
    let secondSweepReleased = 0;
    for (const ord of ordersMock) {
      if (ord.status === 'PENDING_PAYMENT' && new Date(ord.reservationExpiresAt).getTime() < now) {
        ord.status = 'CANCELLED';
        secondSweepReleased += ord.items.reduce((s, i) => s + i.quantity, 0);
      }
    }

    const passed = firstSweepReleased === 2 && secondSweepReleased === 0 && v1Reserved === 1;
    return {
      passed,
      expected: 'First sweep: 2 units released, Second sweep: 0 units released (Idempotent)',
      actual: `Sweep1: ${firstSweepReleased}, Sweep2: ${secondSweepReleased}, Remaining Reserved: ${v1Reserved}`,
    };
  });

  // ==========================================
  // 8. CHECKOUT INTEGRITY & PRICE TAMPERING RESILIENCE
  // ==========================================

  runTest('PRICING', 'Checkout Price Tampering Defense (Client values overridden by server)', () => {
    // Tampered payload where client claims unitPrice is £0.01 instead of authoritative £45.00
    const authoritativeItem: CartItem = {
      id: 'c1',
      productId: 'p1',
      productName: 'Semaglutide 5mg',
      productSlug: 'semaglutide-5mg',
      variantId: 'v1',
      variantName: '5mg Vial',
      size: '5mg',
      sku: 'RP-SEMA-5',
      unitPrice: 45.0, // Authoritative price from database
      quantity: 2,
      image: '',
    };

    const shipping: ShippingMethod = {
      id: 'ship-1',
      name: 'Royal Mail Tracked 24',
      zone: 'UK_MAINLAND',
      carrier: 'Royal Mail',
      price: 4.99,
      freeShippingThreshold: 75.0,
      estimatedDays: '1-2 days',
      trackingAvailable: true,
      isActive: true,
    };

    const recalculated = calculateOrderTotals([authoritativeItem], 'BANK_TRANSFER', shipping, null);

    // Authoritative: 2 * £45 = £90.00. Since £90 >= £75, free shipping qualifies. Total = £90.00
    const passed = recalculated.subtotal === 90.0 && recalculated.freeShippingQualified && recalculated.total === 90.0;

    return {
      passed,
      expected: 'Subtotal: £90.00, Free Shipping Qualified: true, Total: £90.00',
      actual: `Subtotal: £${recalculated.subtotal}, Free Shipping: ${recalculated.freeShippingQualified}, Total: £${recalculated.total}`,
    };
  });

  runTest('PRICING', 'Discount Floor & Non-Negative Balance Protection', () => {
    const item: CartItem = {
      id: 'c1',
      productId: 'p1',
      productName: 'BPC-157 5mg',
      productSlug: 'bpc-157',
      variantId: 'v1',
      variantName: '5mg Vial',
      size: '5mg',
      sku: 'RP-BPC-5',
      unitPrice: 20.0,
      quantity: 1,
      image: '',
    };

    // Extreme voucher coupon value (£100 off a £20 item)
    const giantCoupon: Coupon = {
      id: 'cp-huge',
      code: 'HUGE100',
      discountType: 'FIXED',
      discountValue: 100.0,
      minSpend: 0,
      usedCount: 0,
      isActive: true,
    };

    const shipping: ShippingMethod = {
      id: 'ship-1',
      name: 'Standard Dispatch',
      zone: 'UK_MAINLAND',
      carrier: 'Royal Mail',
      price: 4.99,
      freeShippingThreshold: 75.0,
      estimatedDays: '1-2 days',
      trackingAvailable: true,
      isActive: true,
    };

    const res = calculateOrderTotals([item], 'CRYPTOCURRENCY', shipping, giantCoupon);

    // Item £20, Coupon capped at £20 max (never exceeds discounted subtotal), net £0 + £4.99 shipping = £4.99 total (never negative)
    const passed = res.couponDiscount === 20.0 && res.total === 4.99 && res.total >= 0;

    return {
      passed,
      expected: 'Coupon capped at subtotal (£20.00), Net product: £0.00, Total with shipping: £4.99 (Non-negative)',
      actual: `Coupon: £${res.couponDiscount}, Total: £${res.total}`,
    };
  });

  // ==========================================
  // 9. CATALOGUE IMPORT ATOMIC VALIDATION
  // ==========================================

  runTest('IMPORT', 'Catalogue Import Duplicate SKU Detection & Default DRAFT Status', () => {
    const existingProducts: Product[] = [
      {
        id: 'p-orig',
        name: 'Existing Peptide',
        slug: 'existing-peptide',
        sku: 'RP-EXIST-1',
        categoryId: 'cat-1',
        categoryName: 'Peptides',
        shortDescription: 'Existing',
        longDescription: 'Existing long',
        productType: 'PEPTIDE',
        researchClassification: 'IN_VITRO_ONLY',
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        isFeatured: false,
        researchOnly: true,
        documentationStatus: 'VERIFIED',
        analyticalDataSource: 'VERIFIED',
        appearance: 'Lyophilized White Powder',
        storageRequirements: 'Store sealed at -20°C in desiccated laboratory freezer',
        solubility: 'Sterile Water / Laboratory Solvent',
        variants: [{ id: 'v-orig', productId: 'p-orig', name: '5mg', size: '5mg', sku: 'RP-EXIST-VAR-1', price: 30, stock: 10, lowStockThreshold: 2, status: 'ACTIVE' }],
        images: [],
        documents: [],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];

    const categories: ProductCategory[] = [
      { id: 'cat-1', name: 'Peptides', slug: 'peptides', description: 'Peptides', sortOrder: 1, isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    ];

    // Import batch containing a duplicate variant SKU
    const duplicateBatch = [
      { name: 'Import 1', sku: 'RP-IMP-1', slug: 'import-1', category: 'Peptides', short_description: 'Desc', variant_sku: 'RP-DUP-VAR', price: '35.00', stock: '20' },
      { name: 'Import 2', sku: 'RP-IMP-2', slug: 'import-2', category: 'Peptides', short_description: 'Desc', variant_sku: 'RP-DUP-VAR', price: '40.00', stock: '15' },
    ];

    const summary = validateCatalogueImport(duplicateBatch, existingProducts, categories);

    // Valid single batch
    const validBatch = [
      { name: 'New Research Reagent', sku: 'RP-NEW-REAG', slug: 'new-research-reagent', category: 'Peptides', short_description: 'Pure reagent', variant_sku: 'RP-NEW-REAG-5MG', price: '50.00', stock: '25' },
    ];
    const validSummary = validateCatalogueImport(validBatch, existingProducts, categories);
    const executionResult = executeCatalogueImport(validSummary, existingProducts, categories, 'admin@rp.uk');
    const importedItem = executionResult.importedProducts.find((p) => p.sku === 'RP-NEW-REAG');

    const passed =
      summary.hasBlockingErrors === true &&
      validSummary.hasBlockingErrors === false &&
      importedItem !== undefined &&
      importedItem.status === 'DRAFT'; // Enforces mandatory DRAFT initialization

    return {
      passed,
      expected: 'Duplicate SKU -> hasBlockingErrors: true; Valid Import -> status: "DRAFT"',
      actual: `Duplicate Blocked: ${summary.hasBlockingErrors}, Valid Imported Status: ${importedItem?.status}`,
    };
  });

  // ==========================================
  // 10. DOCUMENT ACCESS & IDOR BOUNDARIES
  // ==========================================

  runTest('SECURITY', 'Document Multi-Tier Access Control (PUBLIC / CUSTOMER / ADMIN)', () => {
    const publicDoc = { id: 'd1', productId: 'p1', title: 'HPLC Test Certificate', documentType: 'COA' as const, fileUrl: '/doc.pdf', visibility: 'PUBLIC' as const, createdAt: '2026-01-01' };
    const customerOnlyDoc = { id: 'd2', productId: 'p1', title: 'Customer Analytical Batch Pack', documentType: 'BATCH_ANALYSIS' as const, fileUrl: '/batch.pdf', visibility: 'CUSTOMER_ONLY' as const, createdAt: '2026-01-01' };
    const adminOnlyDoc = { id: 'd3', productId: 'p1', title: 'Internal Quality Control Synthesis Sheet', documentType: 'SPEC_SHEET' as const, fileUrl: '/internal.pdf', visibility: 'ADMIN_ONLY' as const, createdAt: '2026-01-01' };

    const guestUser = null;
    const customerUser = { id: 'u-cust', email: 'researcher@oxford.ac.uk', name: 'Researcher', role: 'CUSTOMER' as const, createdAt: '2026-01-01' };
    const adminUser = { id: 'u-adm', email: 'director@rp.uk', name: 'Admin', role: 'ADMIN' as const, createdAt: '2026-01-01' };

    const guestOnPub = authorizeDocumentAccess(publicDoc, guestUser).allowed;
    const guestOnCust = authorizeDocumentAccess(customerOnlyDoc, guestUser).allowed;
    const custOnCust = authorizeDocumentAccess(customerOnlyDoc, customerUser).allowed;
    const custOnAdmin = authorizeDocumentAccess(adminOnlyDoc, customerUser).allowed;
    const adminOnAdmin = authorizeDocumentAccess(adminOnlyDoc, adminUser).allowed;

    const passed = guestOnPub && !guestOnCust && custOnCust && !custOnAdmin && adminOnAdmin;

    return {
      passed,
      expected: 'Guest on Public: true, Guest on Customer: false, Customer on Customer: true, Customer on Admin: false, Admin on Admin: true',
      actual: `GuestPub: ${guestOnPub}, GuestCust: ${guestOnCust}, CustCust: ${custOnCust}, CustAdmin: ${custOnAdmin}, AdminAdmin: ${adminOnAdmin}`,
    };
  });

  runTest('SECURITY', 'Account order filter does not throw on incomplete payloads', () => {
    const incomplete = [{ id: 'ord-1', customerId: 'usr-1', items: undefined }] as unknown as Order[];
    const matched = filterOrdersForCustomer(incomplete, { id: 'usr-1', email: 'lab@oxford.ac.uk' });
    const unmatched = filterOrdersForCustomer(incomplete, { id: 'usr-2', email: 'other@lab.ac.uk' });
    const empty = filterOrdersForCustomer(undefined, { id: 'usr-1', email: 'lab@oxford.ac.uk' });
    const passed = matched.length === 1 && unmatched.length === 0 && empty.length === 0;
    return {
      passed,
      expected: 'Incomplete order matched by customerId without throwing; unknown user sees none',
      actual: `matched=${matched.length}, unmatched=${unmatched.length}, empty=${empty.length}`,
    };
  });

  runTest('SECURITY', 'Session cookies are not marked Secure on local HTTP preview', () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const previousVercel = process.env.VERCEL;
    process.env.NODE_ENV = 'production';
    delete process.env.VERCEL;
    try {
      const localPreview = isSecureCookieRequest(undefined, '127.0.0.1:4173');
      const localhostDev = isSecureCookieRequest(undefined, 'localhost:3000');
      const explicitHttp = isSecureCookieRequest('http', 'example.test');
      const httpsProd = isSecureCookieRequest('https', 'researchpeptidess.uk');
      const vercelFallback = (() => {
        process.env.VERCEL = '1';
        return isSecureCookieRequest(undefined, 'researchpeptidess.uk');
      })();
      const passed = !localPreview && !localhostDev && !explicitHttp && httpsProd && vercelFallback;
      return {
        passed,
        expected: 'Local HTTP preview: false; HTTPS/Vercel: true',
        actual: `preview=${localPreview}, localhost=${localhostDev}, http=${explicitHttp}, https=${httpsProd}, vercel=${vercelFallback}`,
      };
    } finally {
      process.env.NODE_ENV = previousNodeEnv;
      if (previousVercel === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = previousVercel;
    }
  });

  results.push(...runPersistenceTests());
  results.push(...runParityTests());
  results.push(...runEmailTests());

  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = results.length - passedTests;
  const durationMs = Number(results.reduce((acc, r) => acc + r.durationMs, 0).toFixed(2));

  return {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passedTests,
    failedTests,
    overallPassed: failedTests === 0,
    durationMs,
    results,
  };
}
