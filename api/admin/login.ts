/**
 * Self-contained admin login for Vercel.
 * Intentionally imports nothing from src/ — those imports crash this serverless function at boot.
 * Auth is env-password first; Neon lookup is best-effort and never required to issue a session.
 */

import { createHmac, scrypt, timingSafeEqual, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';

export const config = { runtime: 'nodejs' };

const scryptAsync = promisify(scrypt);
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
};

function send(res: Res, status: number, body: unknown, extra?: Record<string, string>): void {
  if (res.headersSent) return;
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (extra) {
    for (const [k, v] of Object.entries(extra)) res.setHeader(k, v);
  }
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

function adminConfig() {
  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL);
  const extra = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((v) => normalizeEmail(v))
    .filter(Boolean);
  const expiryDays = Number(process.env.SESSION_EXPIRY_DAYS || 14);
  return {
    allowlist: new Set<string>([adminEmail, ...extra]),
    adminPassword: process.env.ADMIN_PASSWORD || '',
    adminName: process.env.ADMIN_NAME || 'Research Peptides UK Admin',
    signingKey: signingKey(),
    expiryDays: Number.isFinite(expiryDays) && expiryDays > 0 ? expiryDays : 14,
  };
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    timingSafeEqual(a, Buffer.alloc(a.length));
    return false;
  }
  return timingSafeEqual(a, b);
}

async function verifyScrypt(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, saltHex, hashHex] = (storedHash || '').split('$');
  if (algorithm !== 'scrypt' || !saltHex || !hashHex) return false;
  try {
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const derived = (await scryptAsync(password, salt, expected.length || 64)) as Buffer;
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

function databaseUrl(): string | null {
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

async function findAdminHash(
  email: string
): Promise<{ id: string; name: string; role: string; passwordHash: string } | null> {
  const connectionString = databaseUrl();
  if (!connectionString) return null;
  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(connectionString, { fetchOptions: { cache: 'no-store' } });
    const rows = (await sql`
      SELECT id, name, role::text AS role, password_hash AS "passwordHash"
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `) as Array<Record<string, unknown>>;
    const row = rows[0];
    if (!row || typeof row.id !== 'string') return null;
    return {
      id: row.id,
      name: typeof row.name === 'string' ? row.name : '',
      role: typeof row.role === 'string' ? row.role : 'CUSTOMER',
      passwordHash: typeof row.passwordHash === 'string' ? row.passwordHash : '',
    };
  } catch {
    return null;
  }
}

async function upsertAdmin(params: { id: string; email: string; name: string; passwordHash: string }): Promise<void> {
  const connectionString = databaseUrl();
  if (!connectionString) return;
  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(connectionString, { fetchOptions: { cache: 'no-store' } });
    const now = new Date();
    await sql`
      INSERT INTO users (id, email, password_hash, name, role, institution, created_at, updated_at)
      VALUES (${params.id}, ${params.email}, ${params.passwordHash}, ${params.name}, 'ADMIN', 'Research Peptides UK', ${now}, ${now})
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name,
        role = 'ADMIN',
        updated_at = EXCLUDED.updated_at
    `;
  } catch {
    // Session can still be issued without persistence.
  }
}

function createToken(user: { id: string; email: string; name: string }, key: string, expiryDays: number): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    v: 1 as const,
    sub: user.id,
    email: user.email,
    name: user.name,
    role: 'ADMIN' as const,
    iat: now,
    exp: now + expiryDays * 24 * 60 * 60,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', key).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function isSecure(req: Req): boolean {
  const proto = String(req.headers?.['x-forwarded-proto'] || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  if (proto === 'https') return true;
  if (proto === 'http') return false;
  return process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
}

function buildCookie(token: string, maxAge: number, secure: boolean): string {
  const parts = [`${COOKIE}=${encodeURIComponent(token)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAge}`];
  if (secure) parts.push('Secure');
  return parts.join('; ');
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

export default async function handler(req: Req, res: Res): Promise<void> {
  try {
    if (req.method !== 'POST') {
      send(res, 405, { error: 'Method not allowed.' });
      return;
    }

    const config = adminConfig();
    if (!config.signingKey) {
      send(res, 503, { error: 'Authentication service unavailable.', detail: 'AUTH_SECRET missing' });
      return;
    }
    if (!config.adminPassword) {
      send(res, 503, { error: 'Authentication service unavailable.', detail: 'ADMIN_PASSWORD missing' });
      return;
    }

    let email = '';
    let password = '';
    try {
      const body = await readBody(req);
      email = normalizeEmail(typeof body.email === 'string' ? body.email : '');
      password = typeof body.password === 'string' ? body.password : '';
    } catch {
      send(res, 400, { error: 'Invalid email or password.' });
      return;
    }

    if (!email || !password || !config.allowlist.has(email)) {
      await hashPassword('unusable-dummy-password');
      send(res, 401, { error: 'Invalid email or password.' });
      return;
    }

    const envMatches = safeEqual(password, config.adminPassword);
    // Prefer env password so login works even when Neon driver import fails.
    let existing: { id: string; name: string; role: string; passwordHash: string } | null = null;
    let hashMatches = false;
    if (!envMatches) {
      existing = await findAdminHash(email);
      hashMatches = existing?.passwordHash ? await verifyScrypt(password, existing.passwordHash) : false;
      if (!hashMatches || existing?.role !== 'ADMIN') {
        send(res, 401, { error: 'Invalid email or password.' });
        return;
      }
    } else {
      existing = await findAdminHash(email);
    }

    const user = {
      id: existing?.id || `usr_admin_${email.replace(/[^a-z0-9]+/g, '_').replace(/_+$/g, '')}`,
      email,
      name: existing?.name || config.adminName,
      role: 'ADMIN' as const,
    };

    if (envMatches) {
      const nextHash = await hashPassword(password);
      await upsertAdmin({ id: user.id, email, name: user.name, passwordHash: nextHash });
    }

    const token = createToken(user, config.signingKey, config.expiryDays);
    send(
      res,
      200,
      { user },
      {
        'Set-Cookie': buildCookie(token, config.expiryDays * 24 * 60 * 60, isSecure(req)),
      }
    );
  } catch (error) {
    if (res.headersSent) return;
    const detail = (error instanceof Error ? error.message : 'login_failed').slice(0, 160);
    send(res, 503, { error: 'Authentication service unavailable.', detail });
  }
}
