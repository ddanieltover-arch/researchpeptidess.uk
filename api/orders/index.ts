/**
 * Dedicated /api/orders handler for Vercel.
 * Uses api/_lib only (compiled with the function). Do not import from src/.
 */

import { dispatchOrderCreatedEmails } from '../_lib/email/dispatch';

export const config = { runtime: 'nodejs' };

type Res = {
  statusCode: number;
  setHeader: (k: string, v: string) => void;
  end: (b: string) => void;
  headersSent?: boolean;
};
type Req = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
};

function send(res: Res, status: number, body: unknown, ref?: string): void {
  if (res.headersSent) return;
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (ref) res.setHeader('x-correlation-id', ref);
  res.end(JSON.stringify(body));
}

function correlationId(req: Req): string {
  const header = req.headers?.['x-correlation-id'];
  const raw = Array.isArray(header) ? header[0] : header;
  if (raw && /^RP-ERR-[A-F0-9]{4}$/i.test(String(raw).trim())) return String(raw).trim().toUpperCase();
  return `RP-ERR-${Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, '0')}`;
}

async function readBody(req: Req): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body as Record<string, unknown>;
  if (typeof req.body === 'string' && req.body.trim()) return JSON.parse(req.body) as Record<string, unknown>;
  return {};
}

function resolveDatabaseUrl(): string | null {
  for (const key of ['DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL', 'DATABASE_URL_UNPOOLED', 'POSTGRES_URL_NON_POOLING']) {
    const value = (process.env[key] || '').trim();
    if (!value || value.includes('sample-project') || value.includes('user:password@')) continue;
    try {
      const url = new URL(value);
      url.searchParams.delete('channel_binding');
      if (!url.searchParams.get('sslmode')) url.searchParams.set('sslmode', 'require');
      return url.toString();
    } catch {
      return value;
    }
  }
  return null;
}

function toPence(value: number): number {
  return Math.round(Number(value || 0) * 100);
}

function toDbStatus(status: string): string {
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

function normalizeProof(raw?: string): string | undefined {
  const value = (raw || '').trim();
  if (!value) return undefined;
  if (value.toUpperCase() === 'FPS-TRANSFER-PENDING' || value.toUpperCase() === 'CRYPTO-TX-PENDING') return undefined;
  return value;
}

export default async function handler(req: Req, res: Res): Promise<void> {
  const ref = correlationId(req);
  try {
    if (req.method !== 'POST') {
      send(res, 405, { error: 'Method not allowed.', reference: ref }, ref);
      return;
    }

    const body = await readBody(req);
    const order = body.order as Record<string, unknown> | undefined;
    const payment = body.payment as Record<string, unknown> | undefined;
    const inventory = Array.isArray(body.inventory) ? (body.inventory as Array<Record<string, unknown>>) : [];
    const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey : undefined;

    if (!order?.id || !payment?.id) {
      send(res, 400, { error: 'Order and payment payloads are required.', reference: ref }, ref);
      return;
    }

    const connectionString = resolveDatabaseUrl();
    if (!connectionString) {
      send(res, 500, { error: 'The order could not be stored. Reference: ' + ref, reference: ref, detail: 'DATABASE_URL missing' }, ref);
      return;
    }

    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(connectionString, { fetchOptions: { cache: 'no-store' } });

    const proof = normalizeProof(
      (typeof order.paymentProofReference === 'string' ? order.paymentProofReference : undefined) ||
        (typeof payment.transactionHash === 'string' ? payment.transactionHash : undefined)
    );
    const paymentStatus = proof ? 'SUBMITTED' : 'UNPAID';
    const orderStatus = proof ? 'PAYMENT_SUBMITTED' : 'PENDING_PAYMENT';
    const trustedOrder = {
      ...order,
      paymentProofReference: proof,
      paymentStatus,
      status: orderStatus,
      customerEmail: typeof order.customerEmail === 'string' ? order.customerEmail : '',
      customerName: typeof order.customerName === 'string' ? order.customerName : '',
      items: Array.isArray(order.items) ? order.items : [],
      total: Number(order.total || 0),
    };
    const trustedPayment = {
      ...payment,
      status: paymentStatus,
      transactionHash: proof && order.paymentMethod === 'CRYPTOCURRENCY' ? proof : payment.transactionHash,
    };

    if (idempotencyKey) {
      const existing = (await sql`SELECT payload_json FROM orders WHERE idempotency_key = ${idempotencyKey} LIMIT 1`) as Array<{
        payload_json?: string;
      }>;
      if (existing[0]?.payload_json) {
        const parsed = JSON.parse(existing[0].payload_json);
        const payRows = (await sql`SELECT payload_json FROM order_payments WHERE order_id = ${parsed.id} LIMIT 1`) as Array<{
          payload_json?: string;
        }>;
        send(
          res,
          200,
          {
            duplicate: true,
            order: parsed,
            payment: payRows[0]?.payload_json ? JSON.parse(payRows[0].payload_json) : trustedPayment,
            reference: ref,
          },
          ref
        );
        return;
      }
    }

    const now = new Date();
    const orderId = String(trustedOrder.id);
    const items = trustedOrder.items as Array<Record<string, unknown>>;

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
          ${orderId},
          ${String(trustedOrder.orderNumber || '')},
          ${null},
          ${String(trustedOrder.customerEmail || '')},
          ${String(trustedOrder.customerName || '')},
          ${toPence(Number(trustedOrder.subtotal || 0))},
          ${toPence(Number(trustedOrder.tierDiscountAmount || 0))},
          ${typeof trustedOrder.couponCode === 'string' ? trustedOrder.couponCode : null},
          ${toPence(Number(trustedOrder.couponDiscountAmount || 0))},
          ${toPence(Number(trustedOrder.cryptoDiscountAmount || 0))},
          ${typeof trustedOrder.shippingMethodId === 'string' ? trustedOrder.shippingMethodId : null},
          ${toPence(Number(trustedOrder.shippingFee || 0))},
          ${toPence(Number(trustedOrder.total || 0))},
          ${String(trustedOrder.currency || 'GBP')},
          ${String(trustedOrder.paymentMethod || 'BANK_TRANSFER')},
          ${toDbStatus(String(trustedOrder.status))},
          ${typeof trustedOrder.paymentProofReference === 'string' ? trustedOrder.paymentProofReference : null},
          ${typeof trustedOrder.trackingNumber === 'string' ? trustedOrder.trackingNumber : null},
          ${Boolean(trustedOrder.researchConsentSigned)},
          ${JSON.stringify(trustedOrder.shippingAddress || {})},
          ${now},
          ${now},
          ${JSON.stringify(trustedOrder)},
          ${String(trustedOrder.status)},
          ${String(trustedOrder.paymentStatus)},
          ${idempotencyKey ?? null}
        )
      `;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/duplicate|unique|23505/i.test(message) && idempotencyKey) {
        const existing = (await sql`SELECT payload_json FROM orders WHERE id = ${orderId} LIMIT 1`) as Array<{ payload_json?: string }>;
        if (existing[0]?.payload_json) {
          send(res, 200, { duplicate: true, order: JSON.parse(existing[0].payload_json), payment: trustedPayment, reference: ref }, ref);
          return;
        }
      }
      throw error;
    }

    try {
      for (const item of items) {
        await sql`
          INSERT INTO order_items (
            id, order_id, product_id, variant_id, sku, product_name, variant_name, quantity, unit_price_pence, total_price_pence
          ) VALUES (
            ${String(item.id || '')},
            ${orderId},
            ${String(item.productId || '')},
            ${String(item.variantId || '')},
            ${String(item.sku || '')},
            ${String(item.productName || '')},
            ${String(item.variantName || '')},
            ${Number(item.quantity || 0)},
            ${toPence(Number(item.unitPrice || 0))},
            ${toPence(Number(item.totalPrice || 0))}
          )
          ON CONFLICT (id) DO NOTHING
        `;
      }
    } catch (error) {
      await sql`DELETE FROM orders WHERE id = ${orderId}`.catch(() => undefined);
      throw error;
    }

    try {
      await sql`
        INSERT INTO order_payments (
          id, order_id, method, amount_pence, currency, status, reference, transaction_hash, evidence_notes, payload_json, created_at, updated_at
        ) VALUES (
          ${String(trustedPayment.id)},
          ${orderId},
          ${String(trustedPayment.method || 'BANK_TRANSFER')},
          ${toPence(Number(trustedPayment.amount || 0))},
          ${String(trustedPayment.currency || 'GBP')},
          ${String(trustedPayment.status || 'UNPAID')},
          ${typeof trustedPayment.reference === 'string' ? trustedPayment.reference : null},
          ${typeof trustedPayment.transactionHash === 'string' ? trustedPayment.transactionHash : null},
          ${typeof trustedPayment.evidenceNotes === 'string' ? trustedPayment.evidenceNotes : null},
          ${JSON.stringify(trustedPayment)},
          ${now},
          ${now}
        )
      `;
    } catch (error) {
      await sql`DELETE FROM order_items WHERE order_id = ${orderId}`.catch(() => undefined);
      await sql`DELETE FROM orders WHERE id = ${orderId}`.catch(() => undefined);
      throw error;
    }

    try {
      for (const event of inventory) {
        await sql`
          INSERT INTO inventory_events (
            id, variant_id, order_id, transaction_type, quantity_change, balance_after, notes, actor_id, payload_json, created_at
          ) VALUES (
            ${String(event.id || '')},
            ${String(event.variantId || '')},
            ${event.orderId ? String(event.orderId) : null},
            ${String(event.transactionType || 'RESERVATION')},
            ${Number(event.quantityChange || 0)},
            ${Number(event.balanceAfter || 0)},
            ${typeof event.notes === 'string' ? event.notes : null},
            ${typeof event.actorId === 'string' ? event.actorId : null},
            ${JSON.stringify(event)},
            ${new Date(typeof event.createdAt === 'string' ? event.createdAt : Date.now())}
          )
          ON CONFLICT (id) DO NOTHING
        `;
        try {
          await sql`
            UPDATE product_variants
            SET stock_quantity = ${Number(event.balanceAfter || 0)}, updated_at = ${new Date()}
            WHERE id = ${String(event.variantId || '')}
          `;
        } catch {
          // Catalogue-only variant.
        }
      }
    } catch (error) {
      await sql`DELETE FROM inventory_events WHERE order_id = ${orderId}`.catch(() => undefined);
      await sql`DELETE FROM order_payments WHERE order_id = ${orderId}`.catch(() => undefined);
      await sql`DELETE FROM order_items WHERE order_id = ${orderId}`.catch(() => undefined);
      await sql`DELETE FROM orders WHERE id = ${orderId}`.catch(() => undefined);
      throw error;
    }

    try {
      await sql`
        INSERT INTO audit_logs (id, actor, actor_id, action, entity_type, entity_id, payload_json)
        VALUES (
          ${`aud_${orderId}`},
          ${String(trustedOrder.customerEmail || 'guest')},
          ${null},
          ${'ORDER_CREATED'},
          ${'ORDER'},
          ${orderId},
          ${JSON.stringify({
            orderNumber: trustedOrder.orderNumber,
            status: trustedOrder.status,
            paymentStatus: trustedOrder.paymentStatus,
            itemCount: items.length,
          })}
        )
      `;
    } catch {
      // best-effort
    }

    try {
      await dispatchOrderCreatedEmails(
        {
          id: String(trustedOrder.id),
          orderNumber: String(trustedOrder.orderNumber || ''),
          customerEmail: String(trustedOrder.customerEmail || ''),
          customerName: String(trustedOrder.customerName || ''),
          currency: String(trustedOrder.currency || 'GBP'),
          subtotal: Number(trustedOrder.subtotal || 0),
          tierDiscountAmount: Number(trustedOrder.tierDiscountAmount || 0),
          couponCode: typeof trustedOrder.couponCode === 'string' ? trustedOrder.couponCode : undefined,
          couponDiscountAmount: Number(trustedOrder.couponDiscountAmount || 0),
          cryptoDiscountAmount: Number(trustedOrder.cryptoDiscountAmount || 0),
          shippingFee: Number(trustedOrder.shippingFee || 0),
          total: Number(trustedOrder.total || 0),
          paymentMethod: String(trustedOrder.paymentMethod || 'BANK_TRANSFER'),
          status: String(trustedOrder.status || ''),
          paymentStatus: String(trustedOrder.paymentStatus || ''),
          paymentProofReference:
            typeof trustedOrder.paymentProofReference === 'string' ? trustedOrder.paymentProofReference : undefined,
          items: items as never,
          shippingAddress: (trustedOrder.shippingAddress || {}) as never,
          createdAt: new Date().toISOString(),
        },
        {
          id: String(trustedPayment.id),
          method: String(trustedPayment.method || 'BANK_TRANSFER'),
          amount: Number(trustedPayment.amount || 0),
          currency: String(trustedPayment.currency || 'GBP'),
          status: String(trustedPayment.status || ''),
          reference: typeof trustedPayment.reference === 'string' ? trustedPayment.reference : undefined,
          transactionHash:
            typeof trustedPayment.transactionHash === 'string' ? trustedPayment.transactionHash : undefined,
        },
        ref
      );
    } catch (error) {
      console.error(
        JSON.stringify({
          level: 'error',
          route: '/api/orders',
          operation: 'order_email_dispatch',
          reference: ref,
          message: error instanceof Error ? error.message : 'email_failed',
        })
      );
    }

    send(res, 201, { order: trustedOrder, payment: trustedPayment, duplicate: false, reference: ref }, ref);
  } catch (error) {
    const detail = (error instanceof Error ? error.message : 'order_failed').slice(0, 160);
    send(res, 500, { error: 'The order could not be stored. Reference: ' + ref, reference: ref, detail }, ref);
  }
}
