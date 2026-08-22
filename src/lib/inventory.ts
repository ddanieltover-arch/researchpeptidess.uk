/**
 * Research Peptides UK — Inventory & Stock Transaction Engine
 * Prevents overselling, manages reservations during order lifecycle,
 * and maintains audit transactions.
 */

import { ProductVariant, InventoryTransaction } from '../types';

export interface InventoryCheckResult {
  isAvailable: boolean;
  requestedQuantity: number;
  availableStock: number;
  variantId: string;
  variantName: string;
  error?: string;
}

/**
 * Checks if stock is available for a requested quantity.
 */
export function checkVariantStockAvailability(
  variant: ProductVariant,
  requestedQuantity: number
): InventoryCheckResult {
  const reserved = variant.reservedStock || 0;
  const available = Math.max(0, variant.stock - reserved);

  if (available < requestedQuantity) {
    return {
      isAvailable: false,
      requestedQuantity,
      availableStock: available,
      variantId: variant.id,
      variantName: variant.name,
      error: `Insufficient stock for ${variant.name}. Requested: ${requestedQuantity}, Available: ${available}`,
    };
  }

  return {
    isAvailable: true,
    requestedQuantity,
    availableStock: available,
    variantId: variant.id,
    variantName: variant.name,
  };
}

/**
 * Creates an inventory transaction log.
 */
export function recordInventoryTransaction(
  variantId: string,
  transactionType: InventoryTransaction['transactionType'],
  quantityChange: number,
  balanceAfter: number,
  orderId?: string,
  notes?: string,
  actorId?: string
): InventoryTransaction {
  return {
    id: `inv-tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    variantId,
    orderId,
    transactionType,
    quantityChange,
    balanceAfter,
    notes,
    actorId,
    createdAt: new Date().toISOString(),
  };
}
