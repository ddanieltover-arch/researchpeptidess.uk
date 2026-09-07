/**
 * Self-contained /api/admin/orders for Vercel.
 * GET list · PUT/POST update · DELETE remove
 * No imports from src/ or sibling helpers — those crash this runtime.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

export const config = { runtime: 'nodejs' };

const COOKIE = 'rpuk_admin_session';
const DEFAULT_ADMIN_EMAIL = 'info@researchpeptidess.uk';
const PLACEHOLDERS = new Set([
  '',
  'your-64-character-cryptographically-secure-random-secret',
  'your-session-encryption-secret-string',
  'your-jwt-hmac-sha256-signing-key',
]);

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
  url?: string;
};

function send(res: Res, status: number, body: unknown): void {
  if (res.headersSent) return;
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

function signingKey(): string {
  for (const value of [process.env.AUTH_SECRET, process.env.JWT_SIGNING_KEY, process.env.SESSION_SECRET]) {
    const trimmed = (value || '').trim();
    if (trimmed && !PLACEHOLDERS.has(trimmed)) return trimmed;
  }
  return '';
}

function allowlist(): Set<string> {
  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL);
  const extra = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((v) => normalizeEmail(v))
    .filter(Boolean);
  return new Set<string>([adminEmail, ...extra]);
}

function parseCookies(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (!key) continue;
    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      cookies[key] = value;
    }
  }
  return cookies;
}

function readAdmin(cookieHeader: string | undefined): boolean {
  const key = signingKey();
  if (!key) return false;
  const token = parseCookies(cookieHeader)[COOKIE];
  if (!token) return false;
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return false;
  const expected = createHmac('sha256', key).update(encoded).digest('base64url');
  const given = Buffer.from(signature);
  const good = Buffer.from(expected);
  if (given.length !== good.length || !timingSafeEqual(given, good)) return false;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as {
      v: number;
      email: string;
      role: string;
      exp: number;
    };
    if (payload.v !== 1 || payload.role !== 'ADMIN' || payload.exp * 1000 < Date.now()) return false;
    return allowlist().has(normalizeEmail(payload.email));
  } catch {
    return false;
  }
}

function resolveDatabaseUrl(): string | null {
  for (const key of [
    'DATABASE_URL',
    'POSTGRES_URL',
    'POSTGRES_PRISMA_URL',
    'DATABASE_URL_UNPOOLED',
    'POSTGRES_URL_NON_POOLING',
  ]) {
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

function parseJson<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== 'string' || !raw.trim()) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function readBody(req: Req): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body as Record<string, unknown>;
  }
  if (typeof req.body === 'string' && req.body.trim()) {
    return JSON.parse(req.body) as Record<string, unknown>;
  }
  return {};
}

function toPence(value: unknown): number {
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

function cookieHeader(req: Req): string | undefined {
  const header = req.headers?.cookie;
  return Array.isArray(header) ? header.join('; ') : header;
}

async function handleList(sql: ReturnType<Awaited<typeof import('@neondatabase/serverless')>['neon']>, res: Res): Promise<void> {
  const orderRows = (await sql`SELECT payload_json FROM orders ORDER BY created_at DESC`) as Array<{
    payload_json?: string;
  }>;
  const paymentRows = (await sql`SELECT payload_json FROM order_payments`) as Array<{ payload_json?: string }>;
  const inventoryRows = (await sql`
    SELECT id, variant_id, order_id, transaction_type, quantity_change, balance_after, notes, actor_id, payload_json, created_at
    FROM inventory_events
    ORDER BY created_at DESC
  `) as Array<Record<string, unknown>>;

  const orders = orderRows
    .map((row) => parseJson<Record<string, unknown> | null>(row.payload_json, null))
    .filter((row): row is Record<string, unknown> => Boolean(row && row.id));

  const payments = paymentRows
    .map((row) => parseJson<Record<string, unknown> | null>(row.payload_json, null))
    .filter((row): row is Record<string, unknown> => Boolean(row && row.id));

  const inventoryTransactions = inventoryRows.map((row) => {
    const fromPayload = parseJson<Record<string, unknown> | null>(row.payload_json, null);
    if (fromPayload?.id) return fromPayload;
    return {
      id: String(row.id || ''),
      variantId: String(row.variant_id || ''),
      orderId: row.order_id ? String(row.order_id) : undefined,
      transactionType: row.transaction_type,
      quantityChange: Number(row.quantity_change || 0),
      balanceAfter: Number(row.balance_after || 0),
      notes: row.notes ? String(row.notes) : undefined,
      actorId: row.actor_id ? String(row.actor_id) : undefined,
      createdAt: row.created_at ? new Date(String(row.created_at)).toISOString() : new Date().toISOString(),
    };
  });

  send(res, 200, { orders, payments, inventoryTransactions });
}

async function handleUpdate(
  sql: ReturnType<Awaited<typeof import('@neondatabase/serverless')>['neon']>,
  req: Req,
  res: Res
): Promise<void> {
  const body = await readBody(req);
  const order = body.order as Record<string, unknown> | undefined;
  const payment = body.payment as Record<string, unknown> | undefined;
  if (!order?.id) {
    send(res, 400, { error: 'Order payload is required.' });
    return;
  }

  const orderId = String(order.id);
  const now = new Date();
  const updatedOrder: Record<string, unknown> = { ...order, updatedAt: now.toISOString() };

  if (payment?.id) {
    await sql`
      UPDATE order_payments
      SET
        status = ${String(payment.status || '')},
        transaction_hash = ${typeof payment.transactionHash === 'string' ? payment.transactionHash : null},
        evidence_notes = ${typeof payment.evidenceNotes === 'string' ? payment.evidenceNotes : null},
        payload_json = ${JSON.stringify(payment)},
        updated_at = ${now}
      WHERE id = ${String(payment.id)}
    `;
  }

  await sql`
    UPDATE orders
    SET
      order_number = ${String(updatedOrder.orderNumber || '')},
      customer_email = ${String(updatedOrder.customerEmail || '')},
      customer_name = ${String(updatedOrder.customerName || '')},
      subtotal_pence = ${toPence(updatedOrder.subtotal)},
      tier_discount_pence = ${toPence(updatedOrder.tierDiscountAmount)},
      coupon_code = ${typeof updatedOrder.couponCode === 'string' ? updatedOrder.couponCode : null},
      coupon_discount_pence = ${toPence(updatedOrder.couponDiscountAmount)},
      crypto_discount_pence = ${toPence(updatedOrder.cryptoDiscountAmount)},
      shipping_method_id = ${typeof updatedOrder.shippingMethodId === 'string' ? updatedOrder.shippingMethodId : null},
      shipping_pence = ${toPence(updatedOrder.shippingFee)},
      total_pence = ${toPence(updatedOrder.total)},
      currency = ${String(updatedOrder.currency || 'GBP')},
      payment_method = ${String(updatedOrder.paymentMethod || 'BANK_TRANSFER')},
      status = ${toDbStatus(String(updatedOrder.status || 'PENDING_PAYMENT'))},
      payment_proof_reference = ${typeof updatedOrder.paymentProofReference === 'string' ? updatedOrder.paymentProofReference : null},
      tracking_number = ${typeof updatedOrder.trackingNumber === 'string' ? updatedOrder.trackingNumber : null},
      research_consent_signed = ${Boolean(updatedOrder.researchConsentSigned)},
      shipping_address_json = ${JSON.stringify(updatedOrder.shippingAddress || {})},
      payload_json = ${JSON.stringify(updatedOrder)},
      app_status = ${String(updatedOrder.status || '')},
      payment_status = ${String(updatedOrder.paymentStatus || '')},
      updated_at = ${now}
    WHERE id = ${orderId}
  `;

  if (Array.isArray(updatedOrder.items)) {
    await sql`DELETE FROM order_items WHERE order_id = ${orderId}`;
    for (const raw of updatedOrder.items as Array<Record<string, unknown>>) {
      await sql`
        INSERT INTO order_items (
          id, order_id, product_id, variant_id, sku, product_name, variant_name, quantity, unit_price_pence, total_price_pence
        ) VALUES (
          ${String(raw.id || `item_${orderId}_${Math.random().toString(36).slice(2, 8)}`)},
          ${orderId},
          ${String(raw.productId || '')},
          ${String(raw.variantId || '')},
          ${String(raw.sku || raw.variantSku || '')},
          ${String(raw.productName || 'Item')},
          ${String(raw.variantName || raw.size || '')},
          ${Number(raw.quantity || 0)},
          ${toPence(raw.unitPrice)},
          ${toPence(raw.totalPrice)}
        )
        ON CONFLICT (id) DO NOTHING
      `;
    }
  }

  try {
    await sql`
      INSERT INTO audit_logs (id, actor, actor_id, action, entity_type, entity_id, payload_json)
      VALUES (
        ${`aud_upd_${orderId}_${Date.now()}`},
        ${'admin'},
        ${null},
        ${'ORDER_UPDATED'},
        ${'ORDER'},
        ${orderId},
        ${JSON.stringify({ orderNumber: updatedOrder.orderNumber, status: updatedOrder.status })}
      )
    `;
  } catch {
    // best-effort
  }

  send(res, 200, { ok: true, order: updatedOrder, payment: payment || null });
}

async function handleDelete(
  sql: ReturnType<Awaited<typeof import('@neondatabase/serverless')>['neon']>,
  req: Req,
  res: Res
): Promise<void> {
  const body = await readBody(req);
  let orderId = typeof body.orderId === 'string' ? body.orderId : typeof body.id === 'string' ? body.id : '';
  if (!orderId && req.url) {
    try {
      const url = new URL(req.url, 'http://localhost');
      orderId = url.searchParams.get('id') || url.searchParams.get('orderId') || '';
    } catch {
      // ignore
    }
  }
  if (!orderId) {
    send(res, 400, { error: 'Order id is required.' });
    return;
  }

  const existing = (await sql`SELECT id, order_number, payload_json FROM orders WHERE id = ${orderId} LIMIT 1`) as Array<{
    id?: string;
    order_number?: string;
    payload_json?: string;
  }>;
  if (!existing[0]?.id) {
    send(res, 404, { error: 'Order not found.' });
    return;
  }

  await sql`DELETE FROM inventory_events WHERE order_id = ${orderId}`;
  await sql`DELETE FROM order_payments WHERE order_id = ${orderId}`;
  await sql`DELETE FROM order_items WHERE order_id = ${orderId}`;
  await sql`DELETE FROM audit_logs WHERE entity_type = ${'ORDER'} AND entity_id = ${orderId}`;
  await sql`DELETE FROM orders WHERE id = ${orderId}`;

  try {
    await sql`
      INSERT INTO audit_logs (id, actor, actor_id, action, entity_type, entity_id, payload_json)
      VALUES (
        ${`aud_del_${orderId}_${Date.now()}`},
        ${'admin'},
        ${null},
        ${'ORDER_DELETED'},
        ${'ORDER'},
        ${orderId},
        ${JSON.stringify({ orderNumber: existing[0].order_number || orderId })}
      )
    `;
  } catch {
    // best-effort
  }

  send(res, 200, { ok: true, deleted: true, orderId });
}

export default async function handler(req: Req, res: Res): Promise<void> {
  try {
    const method = (req.method || 'GET').toUpperCase();
    if (!['GET', 'HEAD', 'PUT', 'POST', 'DELETE'].includes(method)) {
      send(res, 405, { error: 'Method not allowed.' });
      return;
    }

    if (!readAdmin(cookieHeader(req))) {
      send(res, 401, { error: 'Administrator authentication is required.' });
      return;
    }

    const connectionString = resolveDatabaseUrl();
    if (!connectionString) {
      send(res, 500, { error: 'Commerce records could not be updated.', detail: 'DATABASE_URL missing' });
      return;
    }

    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(connectionString, { fetchOptions: { cache: 'no-store' } });

    if (method === 'GET' || method === 'HEAD') {
      await handleList(sql, res);
      return;
    }
    if (method === 'DELETE') {
      await handleDelete(sql, req, res);
      return;
    }
    await handleUpdate(sql, req, res);
  } catch (error) {
    const detail = (error instanceof Error ? error.message : 'admin_orders_failed').slice(0, 160);
    send(res, 500, { error: 'Commerce records could not be updated.', detail });
  }
}
