/**
 * Order persistence for Vercel api routes (compiled inside api/).
 */

import { asRowArray, requireSql } from './neon';

type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_SUBMITTED'
  | 'PAYMENT_VERIFIED'
  | 'PROCESSING'
  | 'PARTIALLY_FULFILLED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'PAYMENT_EXPIRED'
  | 'REFUNDED';

type PaymentStatus = 'UNPAID' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED' | 'REFUNDED';

interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  tierDiscountAmount?: number;
  couponCode?: string;
  couponDiscountAmount?: number;
  cryptoDiscountAmount?: number;
  shippingMethodId?: string;
  shippingFee: number;
  total: number;
  currency: string;
  paymentMethod: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentProofReference?: string;
  trackingNumber?: string;
  researchConsentSigned?: boolean;
  shippingAddress?: unknown;
}

interface Payment {
  id: string;
  orderId: string;
  method: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  reference?: string;
  transactionHash?: string;
  evidenceNotes?: string;
}

interface InventoryTransaction {
  id: string;
  variantId: string;
  orderId?: string;
  transactionType: string;
  quantityChange: number;
  balanceAfter: number;
  notes?: string;
  actorId?: string;
  createdAt: string;
}

const PLACEHOLDER_PROOFS = new Set(['FPS-TRANSFER-PENDING', 'CRYPTO-TX-PENDING']);

function toPence(value: number): number {
  return Math.round(Number(value || 0) * 100);
}

function normalizeProof(raw?: string): string | undefined {
  const value = (raw || '').trim();
  if (!value) return undefined;
  if (PLACEHOLDER_PROOFS.has(value.toUpperCase())) return undefined;
  return value;
}

function toDbStatus(status: OrderStatus): string {
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
  const proof = normalizeProof(order.paymentProofReference || payment.transactionHash);
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
    },
  };
}

async function persistInventoryEvent(event: InventoryTransaction): Promise<void> {
  const sql = await requireSql();
  await sql`
    INSERT INTO inventory_events (
      id, variant_id, order_id, transaction_type, quantity_change, balance_after, notes, actor_id, payload_json, created_at
    ) VALUES (
      ${event.id},
      ${event.variantId},
      ${event.orderId ?? null},
      ${event.transactionType},
      ${event.quantityChange},
      ${event.balanceAfter},
      ${event.notes ?? null},
      ${event.actorId ?? null},
      ${JSON.stringify(event)},
      ${new Date(event.createdAt)}
    )
    ON CONFLICT (id) DO NOTHING
  `;
  try {
    await sql`
      UPDATE product_variants
      SET stock_quantity = ${event.balanceAfter}, updated_at = ${new Date()}
      WHERE id = ${event.variantId}
    `;
  } catch {
    // Variant may exist only in the bundled catalogue snapshot.
  }
}

export async function persistOrderBundle(params: {
  order: Order;
  payment: Payment;
  inventory: InventoryTransaction[];
  idempotencyKey?: string;
  userId?: string | null;
}): Promise<{ duplicate: boolean; order: Order; payment: Payment }> {
  const sql = await requireSql();
  const trusted = trustedCreateState(params.order, params.payment);
  const order = trusted.order;
  const payment = trusted.payment;
  const userId = params.userId && params.userId !== 'guest' ? params.userId : null;

  if (params.idempotencyKey) {
    const existing = asRowArray(
      await sql`SELECT payload_json FROM orders WHERE idempotency_key = ${params.idempotencyKey} LIMIT 1`
    );
    const parsed = coerceOrder(parseJson<Order | null>(String(existing[0]?.payload_json || ''), null));
    if (parsed) {
      const paymentRow = asRowArray(
        await sql`SELECT payload_json FROM order_payments WHERE order_id = ${parsed.id} LIMIT 1`
      );
      return {
        duplicate: true,
        order: parsed,
        payment: coercePayment(parseJson<Payment | null>(String(paymentRow[0]?.payload_json || ''), null)) || payment,
      };
    }
  }

  const now = new Date();
  try {
    await sql`
      INSERT INTO orders (
        id, order_number, user_id, customer_email, customer_name,
        subtotal_pence, tier_discount_pence, coupon_code, coupon_discount_pence,
        crypto_discount_pence, shipping_method_id, shipping_pence, total_pence,
        currency, payment_method, status, payment_proof_reference, tracking_number,
        research_consent_signed, shipping_address_json, created_at, updated_at,
        payload_json, app_status, payment_status, idempotency_key
      ) VALUES (
        ${order.id},
        ${order.orderNumber},
        ${userId},
        ${order.customerEmail},
        ${order.customerName},
        ${toPence(order.subtotal)},
        ${toPence(order.tierDiscountAmount || 0)},
        ${order.couponCode ?? null},
        ${toPence(order.couponDiscountAmount || 0)},
        ${toPence(order.cryptoDiscountAmount || 0)},
        ${order.shippingMethodId ?? null},
        ${toPence(order.shippingFee)},
        ${toPence(order.total)},
        ${order.currency},
        ${order.paymentMethod},
        ${toDbStatus(order.status)},
        ${order.paymentProofReference ?? null},
        ${order.trackingNumber ?? null},
        ${Boolean(order.researchConsentSigned)},
        ${JSON.stringify(order.shippingAddress || {})},
        ${now},
        ${now},
        ${JSON.stringify(order)},
        ${order.status},
        ${order.paymentStatus},
        ${params.idempotencyKey ?? null}
      )
    `;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/duplicate|unique|23505/i.test(message) && params.idempotencyKey) {
      const existing = asRowArray(await sql`SELECT payload_json FROM orders WHERE id = ${order.id} LIMIT 1`);
      const parsed = coerceOrder(parseJson<Order | null>(String(existing[0]?.payload_json || ''), null));
      if (parsed) return { duplicate: true, order: parsed, payment };
    }
    if (/foreign key|23503/i.test(message) && userId) {
      return persistOrderBundle({ ...params, userId: null });
    }
    throw new Error('ORDER_INSERT_FAILED');
  }

  try {
    for (const item of order.items) {
      await sql`
        INSERT INTO order_items (
          id, order_id, product_id, variant_id, sku, product_name, variant_name, quantity, unit_price_pence, total_price_pence
        ) VALUES (
          ${item.id},
          ${order.id},
          ${item.productId},
          ${item.variantId},
          ${item.sku},
          ${item.productName},
          ${item.variantName},
          ${item.quantity},
          ${toPence(item.unitPrice)},
          ${toPence(item.totalPrice)}
        )
        ON CONFLICT (id) DO NOTHING
      `;
    }
  } catch {
    await sql`DELETE FROM orders WHERE id = ${order.id}`.catch(() => undefined);
    throw new Error('ORDER_ITEMS_INSERT_FAILED');
  }

  try {
    await sql`
      INSERT INTO order_payments (
        id, order_id, method, amount_pence, currency, status, reference, transaction_hash, evidence_notes, payload_json, created_at, updated_at
      ) VALUES (
        ${payment.id},
        ${order.id},
        ${payment.method},
        ${toPence(payment.amount)},
        ${payment.currency},
        ${payment.status},
        ${payment.reference ?? null},
        ${payment.transactionHash ?? null},
        ${payment.evidenceNotes ?? null},
        ${JSON.stringify(payment)},
        ${now},
        ${now}
      )
    `;
  } catch {
    await sql`DELETE FROM order_items WHERE order_id = ${order.id}`.catch(() => undefined);
    await sql`DELETE FROM orders WHERE id = ${order.id}`.catch(() => undefined);
    throw new Error('PAYMENT_INSERT_FAILED');
  }

  try {
    for (const event of params.inventory) {
      await persistInventoryEvent(event);
    }
  } catch {
    await sql`DELETE FROM inventory_events WHERE order_id = ${order.id}`.catch(() => undefined);
    await sql`DELETE FROM order_payments WHERE order_id = ${order.id}`.catch(() => undefined);
    await sql`DELETE FROM order_items WHERE order_id = ${order.id}`.catch(() => undefined);
    await sql`DELETE FROM orders WHERE id = ${order.id}`.catch(() => undefined);
    throw new Error('INVENTORY_RESERVATION_FAILED');
  }

  try {
    await sql`
      INSERT INTO audit_logs (id, actor, actor_id, action, entity_type, entity_id, payload_json)
      VALUES (
        ${`aud_${order.id}`},
        ${order.customerEmail || 'guest'},
        ${userId},
        ${'ORDER_CREATED'},
        ${'ORDER'},
        ${order.id},
        ${JSON.stringify({
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          itemCount: order.items.length,
        })}
      )
    `;
  } catch {
    // Audit is best-effort.
  }

  return { duplicate: false, order, payment };
}

export async function persistPaymentUpdate(payment: Payment, order: Order): Promise<void> {
  const sql = await requireSql();
  const proof = normalizeProof(order.paymentProofReference || payment.transactionHash);
  const safeOrder: Order = {
    ...order,
    paymentProofReference: proof,
    paymentStatus: order.paymentStatus === 'VERIFIED' ? 'SUBMITTED' : order.paymentStatus,
    status: order.status === 'PAYMENT_VERIFIED' ? 'PAYMENT_SUBMITTED' : order.status,
  };
  const safePayment: Payment = {
    ...payment,
    status: payment.status === 'VERIFIED' ? 'SUBMITTED' : payment.status,
  };
  const now = new Date();
  await sql`
    UPDATE order_payments
    SET
      status = ${safePayment.status},
      transaction_hash = ${safePayment.transactionHash ?? null},
      evidence_notes = ${safePayment.evidenceNotes ?? null},
      payload_json = ${JSON.stringify(safePayment)},
      updated_at = ${now}
    WHERE id = ${payment.id}
  `;
  await sql`
    UPDATE orders
    SET
      payload_json = ${JSON.stringify(safeOrder)},
      app_status = ${safeOrder.status},
      payment_status = ${safeOrder.paymentStatus},
      status = ${toDbStatus(safeOrder.status)},
      payment_proof_reference = ${safeOrder.paymentProofReference ?? null},
      tracking_number = ${safeOrder.trackingNumber ?? null},
      updated_at = ${now}
    WHERE id = ${order.id}
  `;
}
