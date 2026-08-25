import { eq } from 'drizzle-orm';
import {
  InventoryTransaction,
  Order,
  OrderStatus,
  Payment,
  PaymentStatus,
} from '../../types';
import { getReadyDb } from '../../db/index';
import { auditLogs, inventoryEvents, orderItems, orderPayments, orders, productVariants } from '../../db/schema';
import { PersistStageError } from '../../lib/persist-error';
import { normalizePaymentProofReference } from '../../lib/settlement-instructions';
import { authorizeOrderAccess } from '../../lib/security';
import { User } from '../../types';

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

function coercePayment(value: unknown): Payment | null {
  if (!value || typeof value !== 'object') return null;
  const payment = value as Payment;
  if (!payment.id) return null;
  return payment;
}

function trustedCreateState(order: Order, payment: Payment): { order: Order; payment: Payment } {
  const proof = normalizePaymentProofReference(order.paymentProofReference || payment.transactionHash);
  const paymentStatus: PaymentStatus = proof ? 'SUBMITTED' : 'UNPAID';
  const orderStatus: OrderStatus = proof ? 'PAYMENT_SUBMITTED' : 'PENDING_PAYMENT';
  return {
    order: {
      ...order,
      paymentProofReference: proof,
      paymentStatus,
      status: orderStatus,
    },
    payment: {
      ...payment,
      status: paymentStatus,
      transactionHash: proof && order.paymentMethod === 'CRYPTOCURRENCY' ? proof : undefined,
      verifiedAt: undefined,
      verifiedBy: undefined,
    },
  };
}

export async function loadCommerceState(): Promise<{
  orders: Order[];
  payments: Payment[];
  inventoryTransactions: InventoryTransaction[];
}> {
  const db = await getReadyDb();
  if (!db) {
    return { orders: [], payments: [], inventoryTransactions: [] };
  }

  const orderRows = await db.select().from(orders);
  const paymentRows = await db.select().from(orderPayments);
  const inventoryRows = await db.select().from(inventoryEvents);

  return {
    orders: orderRows.map((row) => coerceOrder(parseJson<Order | null>(row.payloadJson, null))).filter((row): row is Order => Boolean(row)),
    payments: paymentRows
      .map((row) => coercePayment(parseJson<Payment | null>(row.payloadJson, null)))
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

export async function listCommerceForAdmin(): Promise<{
  orders: Order[];
  payments: Payment[];
  inventoryTransactions: InventoryTransaction[];
}> {
  return loadCommerceState();
}

export async function listCommerceForCustomer(user: { id?: string; email?: string }): Promise<{
  orders: Order[];
  payments: Payment[];
}> {
  const state = await loadCommerceState();
  const principal = {
    id: user.id || '',
    email: user.email || '',
    name: '',
    role: 'CUSTOMER' as const,
    createdAt: '',
  } satisfies User;
  const visible = state.orders.filter((order) => authorizeOrderAccess(order, principal).allowed);
  const ids = new Set(visible.map((order) => order.id));
  return {
    orders: visible,
    payments: state.payments.filter((payment) => ids.has(payment.orderId)),
  };
}

export async function persistOrderBundle(params: {
  order: Order;
  payment: Payment;
  inventory: InventoryTransaction[];
  idempotencyKey?: string;
  userId?: string | null;
}): Promise<{ duplicate: boolean; order: Order; payment: Payment }> {
  const db = await getReadyDb();
  if (!db) {
    throw new PersistStageError('database_connection', 'DATABASE_UNAVAILABLE', 'DATABASE_UNAVAILABLE');
  }

  const trusted = trustedCreateState(params.order, params.payment);
  const order = trusted.order;
  const payment = trusted.payment;
  const userId = params.userId && params.userId !== 'guest' ? params.userId : null;

  if (params.idempotencyKey) {
    try {
      const [existing] = await db
        .select()
        .from(orders)
        .where(eq(orders.idempotencyKey, params.idempotencyKey))
        .limit(1);
      if (existing?.payloadJson) {
        const parsed = coerceOrder(parseJson<Order | null>(existing.payloadJson, null));
        if (parsed) {
          const [paymentRow] = await db
            .select()
            .from(orderPayments)
            .where(eq(orderPayments.orderId, parsed.id))
            .limit(1);
          return {
            duplicate: true,
            order: parsed,
            payment: coercePayment(parseJson<Payment | null>(paymentRow?.payloadJson, null)) || payment,
          };
        }
      }
    } catch (error) {
      throw new PersistStageError('idempotency_lookup', 'SCHEMA_MISSING', 'Idempotency lookup failed.');
    }
  }

  const now = new Date();
  try {
    await db.insert(orders).values({
      id: order.id,
      orderNumber: order.orderNumber,
      userId,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      subtotalPence: toPence(order.subtotal),
      tierDiscountPence: toPence(order.tierDiscountAmount || 0),
      couponCode: order.couponCode,
      couponDiscountPence: toPence(order.couponDiscountAmount || 0),
      cryptoDiscountPence: toPence(order.cryptoDiscountAmount || 0),
      shippingMethodId: order.shippingMethodId,
      shippingPence: toPence(order.shippingFee),
      totalPence: toPence(order.total),
      currency: order.currency,
      paymentMethod: order.paymentMethod,
      status: toDbOrderStatus(order.status),
      paymentProofReference: order.paymentProofReference,
      trackingNumber: order.trackingNumber,
      researchConsentSigned: order.researchConsentSigned,
      shippingAddressJson: JSON.stringify(order.shippingAddress),
      createdAt: now,
      updatedAt: now,
      payloadJson: JSON.stringify(order),
      appStatus: order.status,
      paymentStatus: order.paymentStatus,
      idempotencyKey: params.idempotencyKey,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/duplicate|unique|23505/i.test(message) && params.idempotencyKey) {
      const [existing] = await db.select().from(orders).where(eq(orders.id, order.id)).limit(1);
      const parsed = coerceOrder(parseJson<Order | null>(existing?.payloadJson, null));
      if (parsed) return { duplicate: true, order: parsed, payment };
    }
    if (/foreign key|23503/i.test(message) && userId) {
      return persistOrderBundle({ ...params, userId: null });
    }
    throw new PersistStageError('order_insert', 'CONSTRAINT', 'Order insert failed.');
  }

  try {
    for (const item of order.items) {
      await db
        .insert(orderItems)
        .values({
          id: item.id,
          orderId: order.id,
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
  } catch {
    await db.delete(orders).where(eq(orders.id, order.id)).catch(() => undefined);
    throw new PersistStageError('order_items_insert', 'CONSTRAINT', 'Order item snapshot insert failed.');
  }

  try {
    await db.insert(orderPayments).values({
      id: payment.id,
      orderId: order.id,
      method: payment.method,
      amountPence: toPence(payment.amount),
      currency: payment.currency,
      status: payment.status,
      reference: payment.reference,
      transactionHash: payment.transactionHash,
      evidenceNotes: payment.evidenceNotes,
      payloadJson: JSON.stringify(payment),
      createdAt: now,
      updatedAt: now,
    });
  } catch {
    await db.delete(orderItems).where(eq(orderItems.orderId, order.id)).catch(() => undefined);
    await db.delete(orders).where(eq(orders.id, order.id)).catch(() => undefined);
    throw new PersistStageError('payment_insert', 'CONSTRAINT', 'Payment record insert failed.');
  }

  try {
    for (const event of params.inventory) {
      await persistInventoryEvent(event);
    }
  } catch {
    await db.delete(inventoryEvents).where(eq(inventoryEvents.orderId, order.id)).catch(() => undefined);
    await db.delete(orderPayments).where(eq(orderPayments.orderId, order.id)).catch(() => undefined);
    await db.delete(orderItems).where(eq(orderItems.orderId, order.id)).catch(() => undefined);
    await db.delete(orders).where(eq(orders.id, order.id)).catch(() => undefined);
    throw new PersistStageError('inventory_reservation', 'CONSTRAINT', 'Inventory reservation failed.');
  }

  try {
    await db.insert(auditLogs).values({
      id: `aud_${order.id}`,
      actor: order.customerEmail || 'guest',
      actorId: userId,
      action: 'ORDER_CREATED',
      entityType: 'ORDER',
      entityId: order.id,
      payloadJson: JSON.stringify({
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        itemCount: order.items.length,
      }),
    });
  } catch {
    // Audit is best-effort and must not roll back a paid-path order.
  }

  return { duplicate: false, order, payment };
}

export async function persistPaymentUpdate(payment: Payment, order: Order): Promise<void> {
  const db = await getReadyDb();
  if (!db) throw new PersistStageError('database_connection', 'DATABASE_UNAVAILABLE', 'DATABASE_UNAVAILABLE');
  const proof = normalizePaymentProofReference(order.paymentProofReference || payment.transactionHash);
  const safeOrder: Order = {
    ...order,
    paymentProofReference: proof,
    paymentStatus: order.paymentStatus === 'VERIFIED' ? 'SUBMITTED' : order.paymentStatus,
    status: order.status === 'PAYMENT_VERIFIED' ? 'PAYMENT_SUBMITTED' : order.status,
  };
  const safePayment: Payment = {
    ...payment,
    status: payment.status === 'VERIFIED' ? 'SUBMITTED' : payment.status,
    verifiedAt: undefined,
    verifiedBy: undefined,
  };
  const now = new Date();
  await db
    .update(orderPayments)
    .set({
      status: safePayment.status,
      transactionHash: safePayment.transactionHash,
      evidenceNotes: safePayment.evidenceNotes,
      payloadJson: JSON.stringify(safePayment),
      updatedAt: now,
    })
    .where(eq(orderPayments.id, payment.id));

  await db
    .update(orders)
    .set({
      payloadJson: JSON.stringify(safeOrder),
      appStatus: safeOrder.status,
      paymentStatus: safeOrder.paymentStatus,
      status: toDbOrderStatus(safeOrder.status),
      paymentProofReference: safeOrder.paymentProofReference,
      trackingNumber: safeOrder.trackingNumber,
      updatedAt: now,
    })
    .where(eq(orders.id, order.id));
}

/** Admin-authenticated path: persist the submitted lifecycle state without customer-side sanitization. */
export async function persistTrustedOrderUpdate(order: Order, payment?: Payment): Promise<void> {
  const db = await getReadyDb();
  if (!db) throw new PersistStageError('database_connection', 'DATABASE_UNAVAILABLE', 'DATABASE_UNAVAILABLE');
  const now = new Date();

  if (payment?.id) {
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
  }

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
  const db = await getReadyDb();
  if (!db) throw new PersistStageError('database_connection', 'DATABASE_UNAVAILABLE', 'DATABASE_UNAVAILABLE');
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
