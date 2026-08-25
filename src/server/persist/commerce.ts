import { eq } from 'drizzle-orm';
import {
  InventoryTransaction,
  Order,
  OrderStatus,
  Payment,
} from '../../types';
import { getDb } from '../../db/index';
import { inventoryEvents, orderItems, orderPayments, orders, productVariants } from '../../db/schema';

function toPence(value: number): number {
  return Math.round(Number(value || 0) * 100);
}

function toDbOrderStatus(status: OrderStatus): (typeof orders.$inferInsert)['status'] {
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

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function coerceOrder(value: unknown): Order | null {
  if (!value || typeof value !== 'object') return null;
  const order = value as Order;
  if (!order.id) return null;
  return {
    ...order,
    customerEmail: typeof order.customerEmail === 'string' ? order.customerEmail : '',
    customerName: typeof order.customerName === 'string' ? order.customerName : '',
    items: Array.isArray(order.items) ? order.items : [],
    total: Number.isFinite(Number(order.total)) ? Number(order.total) : 0,
  };
}

export async function loadCommerceState(): Promise<{
  orders: Order[];
  payments: Payment[];
  inventoryTransactions: InventoryTransaction[];
}> {
  const db = getDb();
  if (!db) {
    return { orders: [], payments: [], inventoryTransactions: [] };
  }

  const orderRows = await db.select().from(orders);
  const paymentRows = await db.select().from(orderPayments);
  const inventoryRows = await db.select().from(inventoryEvents);

  return {
    orders: orderRows.map((row) => coerceOrder(parseJson<Order | null>(row.payloadJson, null))).filter((row): row is Order => Boolean(row)),
    payments: paymentRows
      .map((row) => parseJson<Payment | null>(row.payloadJson, null))
      .filter((row): row is Payment => Boolean(row)),
    inventoryTransactions: inventoryRows.map((row) =>
      parseJson<InventoryTransaction>(row.payloadJson, {
        id: row.id,
        variantId: row.variantId,
        orderId: row.orderId || undefined,
        transactionType: row.transactionType as InventoryTransaction['transactionType'],
        quantityChange: row.quantityChange,
        balanceAfter: row.balanceAfter,
        notes: row.notes || undefined,
        actorId: row.actorId || undefined,
        createdAt: row.createdAt.toISOString(),
      })
    ),
  };
}

export async function persistOrderBundle(params: {
  order: Order;
  payment: Payment;
  inventory: InventoryTransaction[];
  idempotencyKey?: string;
}): Promise<{ duplicate: boolean; order: Order; payment: Payment }> {
  const db = getDb();
  if (!db) throw new Error('DATABASE_UNAVAILABLE');

  if (params.idempotencyKey) {
    const [existing] = await db
      .select()
      .from(orders)
      .where(eq(orders.idempotencyKey, params.idempotencyKey))
      .limit(1);
    if (existing?.payloadJson) {
      const parsed = parseJson<Order | null>(existing.payloadJson, null);
      if (parsed) {
        const [paymentRow] = await db
          .select()
          .from(orderPayments)
          .where(eq(orderPayments.orderId, parsed.id))
          .limit(1);
        return {
          duplicate: true,
          order: parsed,
          payment: parseJson<Payment>(paymentRow?.payloadJson, params.payment),
        };
      }
    }
  }

  const now = new Date();
  await db
    .insert(orders)
    .values({
      id: params.order.id,
      orderNumber: params.order.orderNumber,
      userId: null,
      customerEmail: params.order.customerEmail,
      customerName: params.order.customerName,
      subtotalPence: toPence(params.order.subtotal),
      tierDiscountPence: toPence(params.order.tierDiscountAmount || 0),
      couponCode: params.order.couponCode,
      couponDiscountPence: toPence(params.order.couponDiscountAmount || 0),
      cryptoDiscountPence: toPence(params.order.cryptoDiscountAmount || 0),
      shippingMethodId: params.order.shippingMethodId,
      shippingPence: toPence(params.order.shippingFee),
      totalPence: toPence(params.order.total),
      currency: params.order.currency,
      paymentMethod: params.order.paymentMethod,
      status: toDbOrderStatus(params.order.status),
      paymentProofReference: params.order.paymentProofReference,
      trackingNumber: params.order.trackingNumber,
      researchConsentSigned: params.order.researchConsentSigned,
      shippingAddressJson: JSON.stringify(params.order.shippingAddress),
      createdAt: now,
      updatedAt: now,
      payloadJson: JSON.stringify(params.order),
      appStatus: params.order.status,
      paymentStatus: params.order.paymentStatus,
      idempotencyKey: params.idempotencyKey,
    })
    .onConflictDoUpdate({
      target: orders.id,
      set: {
        payloadJson: JSON.stringify(params.order),
        appStatus: params.order.status,
        paymentStatus: params.order.paymentStatus,
        status: toDbOrderStatus(params.order.status),
        paymentProofReference: params.order.paymentProofReference,
        trackingNumber: params.order.trackingNumber,
        updatedAt: now,
      },
    });

  for (const item of params.order.items) {
    await db
      .insert(orderItems)
      .values({
        id: item.id,
        orderId: params.order.id,
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku,
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPricePence: toPence(item.unitPrice),
        totalPricePence: toPence(item.totalPrice),
      })
      .onConflictDoNothing();
  }

  await db
    .insert(orderPayments)
    .values({
      id: params.payment.id,
      orderId: params.order.id,
      method: params.payment.method,
      amountPence: toPence(params.payment.amount),
      currency: params.payment.currency,
      status: params.payment.status,
      reference: params.payment.reference,
      transactionHash: params.payment.transactionHash,
      evidenceNotes: params.payment.evidenceNotes,
      payloadJson: JSON.stringify(params.payment),
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: orderPayments.id,
      set: {
        status: params.payment.status,
        transactionHash: params.payment.transactionHash,
        evidenceNotes: params.payment.evidenceNotes,
        payloadJson: JSON.stringify(params.payment),
        updatedAt: now,
      },
    });

  for (const event of params.inventory) {
    await persistInventoryEvent(event);
  }

  return { duplicate: false, order: params.order, payment: params.payment };
}

export async function persistPaymentUpdate(payment: Payment, order: Order): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('DATABASE_UNAVAILABLE');
  const now = new Date();
  await db
    .update(orderPayments)
    .set({
      status: payment.status,
      transactionHash: payment.transactionHash,
      evidenceNotes: payment.evidenceNotes,
      payloadJson: JSON.stringify(payment),
      updatedAt: now,
    })
    .where(eq(orderPayments.id, payment.id));

  await db
    .update(orders)
    .set({
      payloadJson: JSON.stringify(order),
      appStatus: order.status,
      paymentStatus: order.paymentStatus,
      status: toDbOrderStatus(order.status),
      paymentProofReference: order.paymentProofReference,
      trackingNumber: order.trackingNumber,
      updatedAt: now,
    })
    .where(eq(orders.id, order.id));
}

export async function persistInventoryEvent(event: InventoryTransaction): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('DATABASE_UNAVAILABLE');
  await db
    .insert(inventoryEvents)
    .values({
      id: event.id,
      variantId: event.variantId,
      orderId: event.orderId,
      transactionType: event.transactionType,
      quantityChange: event.quantityChange,
      balanceAfter: event.balanceAfter,
      notes: event.notes,
      actorId: event.actorId,
      payloadJson: JSON.stringify(event),
      createdAt: new Date(event.createdAt),
    })
    .onConflictDoNothing();

  try {
    await db
      .update(productVariants)
      .set({
        stockQuantity: event.balanceAfter,
        updatedAt: new Date(),
      })
      .where(eq(productVariants.id, event.variantId));
  } catch {
    // Variant may exist only in the bundled catalogue snapshot.
  }
}
