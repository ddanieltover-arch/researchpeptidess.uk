import { OrderStatus } from '../types';

export type DbOrderStatus =
  | 'pending_payment'
  | 'payment_submitted'
  | 'payment_verified'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export function toDbOrderStatus(status: OrderStatus): DbOrderStatus {
  switch (status) {
    case 'PAYMENT_SUBMITTED':
      return 'payment_submitted';
    case 'PAYMENT_VERIFIED':
      return 'payment_verified';
    case 'PROCESSING':
    case 'PARTIALLY_FULFILLED':
      return 'processing';
    case 'SHIPPED':
      return 'shipped';
    case 'DELIVERED':
      return 'delivered';
    case 'CANCELLED':
    case 'PAYMENT_EXPIRED':
      return 'cancelled';
    case 'REFUNDED':
      return 'refunded';
    default:
      return 'pending_payment';
  }
}
