/**
 * Self-contained admin session reader for Vercel.
 * Intentionally imports nothing from src/ — those imports crash this serverless function at boot.
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

function readUser(cookieHeader: string | undefined): { id: string; email: string; name: string; role: 'ADMIN' } | null {
  const key = signingKey();
  if (!key) return null;
  const token = parseCookies(cookieHeader)[COOKIE];
  if (!token) return null;
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;
  const expected = createHmac('sha256', key).update(encoded).digest('base64url');
  const given = Buffer.from(signature);
  const good = Buffer.from(expected);
  if (given.length !== good.length || !timingSafeEqual(given, good)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as {
      v: number;
      sub: string;
      email: string;
      name: string;
      role: string;
      exp: number;
    };
    if (payload.v !== 1 || payload.role !== 'ADMIN' || payload.exp * 1000 < Date.now()) return null;
    if (!allowlist().has(normalizeEmail(payload.email))) return null;
    return { id: payload.sub, email: payload.email, name: payload.name, role: 'ADMIN' };
  } catch {
    return null;
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
    send(res, 200, { user: readUser(cookie) });
  } catch {
    send(res, 200, { user: null });
  }
}
