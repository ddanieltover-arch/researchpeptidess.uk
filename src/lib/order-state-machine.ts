/**
 * Research Peptides UK — Order & Payment State Machine Engine
 * Strictly enforces valid lifecycle state transitions, preventing impossible
 * jumps, race conditions, and unauthorized mutations.
 */

import { OrderStatus, PaymentStatus, UserRole } from '../types';

export interface TransitionValidationResult {
  isValid: boolean;
  reason?: string;
  isAdministrativeOverride?: boolean;
}

// Valid transitions for Orders
export const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ['PENDING_PAYMENT', 'CANCELLED'],
  PENDING_PAYMENT: ['PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED', 'CANCELLED', 'PAYMENT_EXPIRED'],
  PAYMENT_SUBMITTED: ['PAYMENT_VERIFIED', 'PENDING_PAYMENT', 'CANCELLED', 'PAYMENT_EXPIRED'],
  PAYMENT_VERIFIED: ['PROCESSING', 'CANCELLED', 'REFUNDED'],
  PROCESSING: ['PARTIALLY_FULFILLED', 'SHIPPED', 'CANCELLED', 'REFUNDED'],
  PARTIALLY_FULFILLED: ['SHIPPED', 'CANCELLED', 'REFUNDED'],
  SHIPPED: ['DELIVERED', 'REFUNDED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
  PAYMENT_EXPIRED: ['PENDING_PAYMENT', 'CANCELLED'],
};

// Valid transitions for Payments
export const VALID_PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  UNPAID: ['AWAITING_CUSTOMER_ACTION', 'SUBMITTED', 'EXPIRED', 'FAILED'],
  AWAITING_CUSTOMER_ACTION: ['SUBMITTED', 'UNDER_REVIEW', 'EXPIRED', 'FAILED'],
  SUBMITTED: ['UNDER_REVIEW', 'VERIFIED', 'FAILED', 'AWAITING_CUSTOMER_ACTION'],
  UNDER_REVIEW: ['VERIFIED', 'FAILED', 'AWAITING_CUSTOMER_ACTION'],
  VERIFIED: ['REFUNDED'],
  FAILED: ['AWAITING_CUSTOMER_ACTION', 'SUBMITTED', 'EXPIRED'],
  EXPIRED: ['AWAITING_CUSTOMER_ACTION'],
  REFUNDED: [],
};

/**
 * Validates if an order status change is permitted.
 */
export function validateOrderTransition(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
  actorRole: UserRole = 'CUSTOMER',
  adminJustification?: string
): TransitionValidationResult {
  if (currentStatus === nextStatus) {
    return { isValid: true };
  }

  // Check if transition is in valid path
  const allowedNext = VALID_ORDER_TRANSITIONS[currentStatus] || [];
  if (allowedNext.includes(nextStatus)) {
    return { isValid: true };
  }

  // Administrative correction override: Only allowed for Admins with recorded justification
  if (actorRole === 'ADMIN' && adminJustification && adminJustification.trim().length >= 10) {
    return {
      isValid: true,
      isAdministrativeOverride: true,
      reason: `Administrative manual correction: ${adminJustification}`,
    };
  }

  return {
    isValid: false,
    reason: `Invalid order status transition from ${currentStatus} to ${nextStatus}. Allowed next states: ${
      allowedNext.length > 0 ? allowedNext.join(', ') : 'None (Terminal state)'
    }`,
  };
}

/**
 * Validates if a payment status change is permitted.
 */
export function validatePaymentTransition(
  currentStatus: PaymentStatus,
  nextStatus: PaymentStatus,
  actorRole: UserRole = 'CUSTOMER'
): TransitionValidationResult {
  if (currentStatus === nextStatus) {
    return { isValid: true };
  }

  const allowedNext = VALID_PAYMENT_TRANSITIONS[currentStatus] || [];
  if (allowedNext.includes(nextStatus)) {
    return { isValid: true };
  }

  if (actorRole === 'ADMIN') {
    return {
      isValid: true,
      isAdministrativeOverride: true,
      reason: `Admin override on payment status`,
    };
  }

  return {
    isValid: false,
    reason: `Invalid payment status transition from ${currentStatus} to ${nextStatus}. Allowed next states: ${
      allowedNext.length > 0 ? allowedNext.join(', ') : 'None'
    }`,
  };
}

/**
 * Human-readable metadata & presentation details for Order Statuses
 */
export function getOrderStatusDetails(status: OrderStatus): {
  label: string;
  variant: 'neutral' | 'scientific' | 'gold' | 'warning' | 'destructive' | 'success';
  description: string;
} {
  switch (status) {
    case 'DRAFT':
      return {
        label: 'Draft Order',
        variant: 'neutral',
        description: 'Order is in formulation stage.',
      };
    case 'PENDING_PAYMENT':
      return {
        label: 'Pending Settlement',
        variant: 'warning',
        description: 'Awaiting institutional bank transfer or cryptocurrency transaction.',
      };
    case 'PAYMENT_SUBMITTED':
      return {
        label: 'Payment Submitted',
        variant: 'gold',
        description: 'Payment reference/evidence received. Awaiting admin laboratory audit.',
      };
    case 'PAYMENT_VERIFIED':
      return {
        label: 'Payment Verified',
        variant: 'success',
        description: 'Funds confirmed received by laboratory finance core.',
      };
    case 'PROCESSING':
      return {
        label: 'Laboratory Processing',
        variant: 'scientific',
        description: 'Compounds undergoing batch verification, desiccated packaging & QC check.',
      };
    case 'PARTIALLY_FULFILLED':
      return {
        label: 'Partially Fulfilled',
        variant: 'warning',
        description: 'Partial consignment dispatched; remaining compounds in synthesis queue.',
      };
    case 'SHIPPED':
      return {
        label: 'Dispatched & Tracked',
        variant: 'scientific',
        description: 'Consignment handed over to secure tracked courier with temperature logs.',
      };
    case 'DELIVERED':
      return {
        label: 'Delivered',
        variant: 'success',
        description: 'Consignment confirmed delivered to receiving facility.',
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        variant: 'destructive',
        description: 'Order cancelled and inventory reservations released.',
      };
    case 'REFUNDED':
      return {
        label: 'Refunded',
        variant: 'neutral',
        description: 'Payment returned to origin institution account.',
      };
    case 'PAYMENT_EXPIRED':
      return {
        label: 'Payment Expired',
        variant: 'destructive',
        description: 'Settlement window exceeded without evidence; inventory released.',
      };
    default:
      return {
        label: status,
        variant: 'neutral',
        description: 'Status updated.',
      };
  }
}

/**
 * Human-readable metadata for Payment Statuses
 */
export function getPaymentStatusDetails(status: PaymentStatus): {
  label: string;
  variant: 'neutral' | 'scientific' | 'gold' | 'warning' | 'destructive' | 'success';
  description: string;
} {
  switch (status) {
    case 'UNPAID':
      return {
        label: 'Unpaid',
        variant: 'destructive',
        description: 'No payment transaction initiated.',
      };
    case 'AWAITING_CUSTOMER_ACTION':
      return {
        label: 'Awaiting Settlement',
        variant: 'warning',
        description: 'Bank transfer instructions or crypto deposit address generated.',
      };
    case 'SUBMITTED':
      return {
        label: 'Submitted for Audit',
        variant: 'gold',
        description: 'Customer provided transfer reference or blockchain transaction hash.',
      };
    case 'UNDER_REVIEW':
      return {
        label: 'Under Audit',
        variant: 'warning',
        description: 'Laboratory finance is reconciling the statement ledger.',
      };
    case 'VERIFIED':
      return {
        label: 'Verified & Cleared',
        variant: 'success',
        description: 'Full settlement amount confirmed received in institutional account.',
      };
    case 'FAILED':
      return {
        label: 'Settlement Failed',
        variant: 'destructive',
        description: 'Payment reference could not be reconciled or bounced.',
      };
    case 'EXPIRED':
      return {
        label: 'Settlement Expired',
        variant: 'destructive',
        description: 'Payment window passed without verified transfer.',
      };
    case 'REFUNDED':
      return {
        label: 'Refunded',
        variant: 'neutral',
        description: 'Settlement reversed to customer account.',
      };
    default:
      return {
        label: status,
        variant: 'neutral',
        description: 'Payment status.',
      };
  }
}
