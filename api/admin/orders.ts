/**
 * Self-contained GET /api/admin/orders for Vercel.
 * Lists commerce snapshots from Neon so the admin console can see placed orders.
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

function parseJson<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== 'string' || !raw.trim()) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default async function handler(req: Req, res: Res): Promise<void> {
  try {
    if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
      send(res, 405, { error: 'Method not allowed.' });
      return;
    }

    const header = req.headers?.cookie;
    const cookie = Array.isArray(header) ? header.join('; ') : header;
    if (!readAdmin(cookie)) {
      send(res, 401, { error: 'Administrator authentication is required.' });
      return;
    }

    const connectionString = resolveDatabaseUrl();
    if (!connectionString) {
      send(res, 500, { error: 'Commerce records could not be loaded.', detail: 'DATABASE_URL missing' });
      return;
    }

    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(connectionString, { fetchOptions: { cache: 'no-store' } });

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
  } catch (error) {
    const detail = (error instanceof Error ? error.message : 'load_failed').slice(0, 160);
    send(res, 500, { error: 'Commerce records could not be loaded.', detail });
  }
}
