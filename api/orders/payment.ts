/**
 * Dedicated /api/orders/payment handler for Vercel.
 */

import { dispatchOrderEventEmails } from '../_lib/email/dispatch';

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
    if (!order?.id || !payment?.id) {
      send(res, 400, { error: 'Order and payment payloads are required.', reference: ref }, ref);
      return;
    }

    const connectionString = resolveDatabaseUrl();
    if (!connectionString) {
      send(res, 500, { error: 'Payment state could not be stored. Reference: ' + ref, reference: ref, detail: 'DATABASE_URL missing' }, ref);
      return;
    }

    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(connectionString, { fetchOptions: { cache: 'no-store' } });

    const proof = normalizeProof(
      (typeof order.paymentProofReference === 'string' ? order.paymentProofReference : undefined) ||
        (typeof payment.transactionHash === 'string' ? payment.transactionHash : undefined)
    );
    const safeOrder = {
      ...order,
      paymentProofReference: proof,
      paymentStatus: order.paymentStatus === 'VERIFIED' ? 'SUBMITTED' : order.paymentStatus,
      status: order.status === 'PAYMENT_VERIFIED' ? 'PAYMENT_SUBMITTED' : order.status,
    };
    const safePayment = {
      ...payment,
      status: payment.status === 'VERIFIED' ? 'SUBMITTED' : payment.status,
    };
    const now = new Date();

    await sql`
      UPDATE order_payments
      SET
        status = ${String(safePayment.status || '')},
        transaction_hash = ${typeof safePayment.transactionHash === 'string' ? safePayment.transactionHash : null},
        evidence_notes = ${typeof safePayment.evidenceNotes === 'string' ? safePayment.evidenceNotes : null},
        payload_json = ${JSON.stringify(safePayment)},
        updated_at = ${now}
      WHERE id = ${String(payment.id)}
    `;
    await sql`
      UPDATE orders
      SET
        payload_json = ${JSON.stringify(safeOrder)},
        app_status = ${String(safeOrder.status || '')},
        payment_status = ${String(safeOrder.paymentStatus || '')},
        status = ${toDbStatus(String(safeOrder.status || ''))},
        payment_proof_reference = ${typeof safeOrder.paymentProofReference === 'string' ? safeOrder.paymentProofReference : null},
        tracking_number = ${typeof safeOrder.trackingNumber === 'string' ? safeOrder.trackingNumber : null},
        updated_at = ${now}
      WHERE id = ${String(order.id)}
    `;

    try {
      await dispatchOrderEventEmails(
        'PAYMENT_SUBMITTED',
        {
          id: String(safeOrder.id),
          orderNumber: String(safeOrder.orderNumber || ''),
          customerEmail: String(safeOrder.customerEmail || ''),
          customerName: String(safeOrder.customerName || ''),
          currency: String(safeOrder.currency || 'GBP'),
          total: Number(safeOrder.total || 0),
          paymentMethod: String(safeOrder.paymentMethod || 'BANK_TRANSFER'),
          status: String(safeOrder.status || ''),
          paymentStatus: String(safeOrder.paymentStatus || ''),
          paymentProofReference:
            typeof safeOrder.paymentProofReference === 'string' ? safeOrder.paymentProofReference : undefined,
          items: Array.isArray(safeOrder.items) ? (safeOrder.items as never) : [],
          shippingAddress: (safeOrder.shippingAddress || {}) as never,
        },
        {
          id: String(safePayment.id),
          method: String(safePayment.method || 'BANK_TRANSFER'),
          amount: Number(safePayment.amount || 0),
          currency: String(safePayment.currency || 'GBP'),
          status: String(safePayment.status || ''),
          transactionHash:
            typeof safePayment.transactionHash === 'string' ? safePayment.transactionHash : undefined,
        }
      );
    } catch (error) {
      console.error(
        JSON.stringify({
          level: 'error',
          route: '/api/orders/payment',
          operation: 'order_email_dispatch',
          reference: ref,
          message: error instanceof Error ? error.message : 'email_failed',
        })
      );
    }

    send(res, 200, { ok: true, order: safeOrder, payment: safePayment, reference: ref }, ref);
  } catch (error) {
    const detail = (error instanceof Error ? error.message : 'payment_failed').slice(0, 160);
    send(res, 500, { error: 'Payment state could not be stored. Reference: ' + ref, reference: ref, detail }, ref);
  }
}
