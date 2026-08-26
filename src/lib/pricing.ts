/**
 * Research Peptides UK — Server-Authoritative Pricing Engine
 * Client-submitted totals are never trusted directly.
 * All discounts, quantity tiers, coupons, shipping rates, and crypto deductions are computed authoritatively.
 */

import { CartItem, PaymentMethod, PricingTier, Coupon, ShippingMethod } from '../types';

export interface OrderCalculationResult {
  subtotal: number;
  itemDiscounts: number;
  couponDiscount: number;
  cryptoDiscount: number;
  shippingFee: number;
  total: number;
  freeShippingQualified: boolean;
  amountNeededForFreeShipping: number;
  appliedCouponDetails?: {
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    amount: number;
  };
}

export const DEFAULT_FREE_SHIPPING_THRESHOLD = 200.0; // £200.00
export const CRYPTO_DISCOUNT_PERCENT = 5; // 5% business rule discount
export const BANK_TRANSFER_MIN_MERCHANDISE_TOTAL = 100.0;
/** RESEARCH10: 10% off when catalogue subtotal (before volume discounts) is £300 or more. */
export const RESEARCH10_CODE = 'RESEARCH10';
export const RESEARCH10_MIN_SPEND = 300;

export function merchandiseTotalForPayment(totals: {
  subtotal: number;
  itemDiscounts: number;
  couponDiscount: number;
}): number {
  return Math.max(0, Number((totals.subtotal - totals.itemDiscounts - totals.couponDiscount).toFixed(2)));
}

export function isBankTransferAvailable(merchandiseTotal: number): boolean {
  return merchandiseTotal >= BANK_TRANSFER_MIN_MERCHANDISE_TOTAL;
}

/**
 * Free shipping is earned on catalogue subtotal (before volume, coupon, or crypto).
 * Checkout method labels and the payable shipping fee must use this same spend figure.
 */
export function resolveFreeShipping(
  merchandiseSubtotal: number,
  shippingMethod?: ShippingMethod | null
): { qualified: boolean; fee: number; amountNeeded: number; threshold: number | null } {
  const spend = Math.max(0, Number(merchandiseSubtotal) || 0);
  const configured = shippingMethod?.freeShippingThreshold;
  const threshold =
    typeof configured === 'number' && configured > 0
      ? configured
      : shippingMethod
        ? null
        : DEFAULT_FREE_SHIPPING_THRESHOLD;
  const qualified = threshold !== null && spend >= threshold;
  const baseFee = shippingMethod ? shippingMethod.price : 4.99;
  return {
    qualified,
    fee: qualified ? 0 : baseFee,
    amountNeeded: threshold === null ? 0 : Math.max(0, Number((threshold - spend).toFixed(2))),
    threshold,
  };
}

/**
 * Calculates line-item quantity tier discount based on database rules or fallback stepped volume tiers.
 */
export function calculateTierDiscountForLine(
  quantity: number,
  unitPrice: number,
  tiers?: PricingTier[]
): number {
  const lineTotal = unitPrice * quantity;

  if (tiers && tiers.length > 0) {
    // Match the highest applicable active tier
    const applicableTiers = tiers
      .filter((t) => t.isActive && quantity >= t.minQuantity && (!t.maxQuantity || quantity <= t.maxQuantity))
      .sort((a, b) => b.minQuantity - a.minQuantity);

    if (applicableTiers.length > 0) {
      const bestTier = applicableTiers[0];
      if (bestTier.discountType === 'PERCENTAGE') {
        return lineTotal * (bestTier.discountValue / 100);
      } else if (bestTier.discountType === 'FIXED_AMOUNT') {
        return bestTier.discountValue * quantity;
      }
    }
  }

  // Standard laboratory volume tiers fallback
  // 3 - 5 units: 10%
  // 6 - 9 units: 15%
  // 10+ units: 20%
  if (quantity >= 10) {
    return lineTotal * 0.20;
  } else if (quantity >= 6) {
    return lineTotal * 0.15;
  } else if (quantity >= 3) {
    return lineTotal * 0.10;
  }

  return 0;
}

/**
 * Validates whether a coupon is eligible for application.
 * `subtotal` must be catalogue subtotal (before volume, coupon, or crypto), matching apply-time checks.
 */
export function validateCoupon(
  coupon: Coupon | null | undefined,
  subtotal: number,
  now: Date = new Date()
): { isValid: boolean; reason?: string } {
  if (!coupon) {
    return { isValid: false, reason: 'Coupon code not found' };
  }

  if (!coupon.isActive) {
    return { isValid: false, reason: 'Coupon is inactive or disabled' };
  }

  if (coupon.startDate && new Date(coupon.startDate) > now) {
    return { isValid: false, reason: 'Coupon promotion has not started yet' };
  }

  if (coupon.endDate && new Date(coupon.endDate) < now) {
    return { isValid: false, reason: 'Coupon has expired' };
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { isValid: false, reason: 'Coupon usage limit has been reached' };
  }

  if (coupon.minSpend && subtotal < coupon.minSpend) {
    return {
      isValid: false,
      reason: `Minimum order value of £${coupon.minSpend.toFixed(2)} required for this voucher`,
    };
  }

  return { isValid: true };
}

/**
 * Authoritatively calculates basket totals, discounts, shipping, and taxes.
 */
export function calculateOrderTotals(
  items: CartItem[],
  paymentMethod: PaymentMethod = 'BANK_TRANSFER',
  shippingMethod?: ShippingMethod | null,
  activeCoupon?: Coupon | null,
  customTiersMap?: Record<string, PricingTier[]>
): OrderCalculationResult {
  let subtotal = 0;
  let itemDiscounts = 0;

  for (const item of items) {
    const rawLine = item.unitPrice * item.quantity;
    subtotal += rawLine;

    const variantTiers = customTiersMap ? customTiersMap[item.variantId] : undefined;
    itemDiscounts += calculateTierDiscountForLine(item.quantity, item.unitPrice, variantTiers);
  }

  const discountedSubtotal = Math.max(0, subtotal - itemDiscounts);

  // Validate and compute coupon discount
  let couponDiscount = 0;
  let appliedCouponDetails: OrderCalculationResult['appliedCouponDetails'];

  if (activeCoupon) {
    const validation = validateCoupon(activeCoupon, subtotal);
    if (validation.isValid) {
      if (activeCoupon.discountType === 'PERCENTAGE') {
        couponDiscount = discountedSubtotal * (activeCoupon.discountValue / 100);
      } else {
        couponDiscount = activeCoupon.discountValue;
      }

      if (activeCoupon.maxDiscount && couponDiscount > activeCoupon.maxDiscount) {
        couponDiscount = activeCoupon.maxDiscount;
      }
      couponDiscount = Math.min(couponDiscount, discountedSubtotal);

      appliedCouponDetails = {
        code: activeCoupon.code,
        discountType: activeCoupon.discountType,
        discountValue: activeCoupon.discountValue,
        amount: Number(couponDiscount.toFixed(2)),
      };
    }
  }

  const afterCoupon = Math.max(0, discountedSubtotal - couponDiscount);

  // 5% Crypto settlement deduction
  const cryptoDiscount =
    paymentMethod === 'CRYPTOCURRENCY' ? afterCoupon * (CRYPTO_DISCOUNT_PERCENT / 100) : 0;
  const afterCrypto = Math.max(0, afterCoupon - cryptoDiscount);

  const shipping = resolveFreeShipping(subtotal, shippingMethod);
  const shippingFee = shipping.fee;
  const freeShippingQualified = shipping.qualified;
  const amountNeededForFreeShipping = shipping.amountNeeded;

  const total = Number((afterCrypto + shippingFee).toFixed(2));

  return {
    subtotal: Number(subtotal.toFixed(2)),
    itemDiscounts: Number(itemDiscounts.toFixed(2)),
    couponDiscount: Number(couponDiscount.toFixed(2)),
    cryptoDiscount: Number(cryptoDiscount.toFixed(2)),
    shippingFee: Number(shippingFee.toFixed(2)),
    total,
    freeShippingQualified,
    amountNeededForFreeShipping: Number(amountNeededForFreeShipping.toFixed(2)),
    appliedCouponDetails,
  };
}
