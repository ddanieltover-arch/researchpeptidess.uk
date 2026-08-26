/**
 * HMAC session cookies. Keep this module free of Drizzle so persist routes can boot on Vercel.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { ADMIN_SESSION_COOKIE, AdminSessionUser } from '../lib/admin-session';
import { CUSTOMER_SESSION_COOKIE, CustomerSessionUser } from '../lib/customer-session';
import { UserRole } from '../types';

export { isSecureCookieRequest } from '../lib/cookie-security';

const DEFAULT_ADMIN_EMAIL = 'info@researchpeptidess.uk';
const PLACEHOLDER_SECRETS = new Set([
  '',
  'your-64-character-cryptographically-secure-random-secret',
  'your-session-encryption-secret-string',
  'your-jwt-hmac-sha256-signing-key',
]);

export interface AdminAuthConfig {
  adminEmail: string;
  allowlist: Set<string>;
  adminPassword: string;
  adminName: string;
  signingKey: string;
  expiryDays: number;
}

interface AdminSessionPayload {
  v: 1;
  sub: string;
  email: string;
  name: string;
  role: 'ADMIN';
  iat: number;
  exp: number;
}

interface CustomerSessionPayload {
  v: 1;
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  institution?: string;
  phone?: string;
  iat: number;
  exp: number;
}

function firstConfiguredSecret(...values: Array<string | undefined>): string {
  for (const value of values) {
    const trimmed = (value || '').trim();
    if (trimmed && !PLACEHOLDER_SECRETS.has(trimmed)) {
      return trimmed;
    }
  }
  return '';
}

export function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

export function getAdminAuthConfig(): AdminAuthConfig {
  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL);
  const extra = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((value) => normalizeEmail(value))
    .filter(Boolean);
  const allowlist = new Set<string>([adminEmail, ...extra]);
  const signingKey = firstConfiguredSecret(
    process.env.AUTH_SECRET,
    process.env.JWT_SIGNING_KEY,
    process.env.SESSION_SECRET
  );
  const expiryDays = Number(process.env.SESSION_EXPIRY_DAYS || 14);

  return {
    adminEmail,
    allowlist,
    adminPassword: process.env.ADMIN_PASSWORD || '',
    adminName: process.env.ADMIN_NAME || 'Research Peptides UK Admin',
    signingKey,
    expiryDays: Number.isFinite(expiryDays) && expiryDays > 0 ? expiryDays : 14,
  };
}

export function isAdminEmailAllowed(email: string, config = getAdminAuthConfig()): boolean {
  return config.allowlist.has(normalizeEmail(email));
}

export function parseCookieHeader(header: string | undefined): Record<string, string> {
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

function signPayload(payload: object, signingKey: string): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', signingKey).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function verifyToken<T extends { v: 1; exp: number }>(token: string, signingKey: string): T | null {
  const [encoded, signature] = (token || '').split('.');
  if (!encoded || !signature) return null;

  const expected = createHmac('sha256', signingKey).update(encoded).digest('base64url');
  const given = Buffer.from(signature);
  const good = Buffer.from(expected);
  if (given.length !== good.length || !timingSafeEqual(given, good)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as T;
    if (payload.v !== 1 || payload.exp * 1000 < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function createAdminSessionToken(user: AdminSessionUser, config = getAdminAuthConfig()): string {
  if (!config.signingKey || PLACEHOLDER_SECRETS.has(config.signingKey)) {
    throw new Error('AUTH_SECRET is not configured');
  }
  const now = Math.floor(Date.now() / 1000);
  return signPayload(
    {
      v: 1,
      sub: user.id,
      email: user.email,
      name: user.name,
      role: 'ADMIN',
      iat: now,
      exp: now + config.expiryDays * 24 * 60 * 60,
    } satisfies AdminSessionPayload,
    config.signingKey
  );
}

export function readAdminSessionFromCookieHeader(cookieHeader: string | undefined): AdminSessionUser | null {
  const config = getAdminAuthConfig();
  if (!config.signingKey || PLACEHOLDER_SECRETS.has(config.signingKey)) {
    return null;
  }
  const token = parseCookieHeader(cookieHeader)[ADMIN_SESSION_COOKIE];
  if (!token) return null;
  const payload = verifyToken<AdminSessionPayload>(token, config.signingKey);
  if (!payload || payload.role !== 'ADMIN' || !isAdminEmailAllowed(payload.email, config)) return null;
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    role: 'ADMIN',
  };
}

export function buildSessionCookie(token: string, maxAgeSeconds: number, secure: boolean): string {
  const parts = [
    `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function buildExpiredSessionCookie(secure: boolean): string {
  const parts = [
    `${ADMIN_SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function getSessionCookieMaxAge(config = getAdminAuthConfig()): number {
  return config.expiryDays * 24 * 60 * 60;
}

export function createCustomerSessionToken(user: CustomerSessionUser): string {
  const config = getAdminAuthConfig();
  if (!config.signingKey || PLACEHOLDER_SECRETS.has(config.signingKey)) {
    throw new Error('AUTH_SECRET is not configured');
  }
  const now = Math.floor(Date.now() / 1000);
  return signPayload(
    {
      v: 1,
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      institution: user.institution,
      phone: user.phone,
      iat: now,
      exp: now + config.expiryDays * 24 * 60 * 60,
    } satisfies CustomerSessionPayload,
    config.signingKey
  );
}

export function readCustomerSessionFromCookieHeader(cookieHeader: string | undefined): CustomerSessionUser | null {
  const signingKey = getAdminAuthConfig().signingKey;
  if (!signingKey || PLACEHOLDER_SECRETS.has(signingKey)) return null;
  const token = parseCookieHeader(cookieHeader)[CUSTOMER_SESSION_COOKIE];
  if (!token) return null;
  const payload = verifyToken<CustomerSessionPayload>(token, signingKey);
  if (!payload) return null;
  const validRole = payload.role === 'CUSTOMER' || payload.role === 'ADMIN' || payload.role === 'ANALYST';
  if (!validRole) return null;
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    institution: payload.institution,
    phone: payload.phone,
  };
}

export function buildCustomerSessionCookie(token: string, maxAgeSeconds: number, secure: boolean): string {
  const parts = [
    `${CUSTOMER_SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function buildExpiredCustomerSessionCookie(secure: boolean): string {
  const parts = [
    `${CUSTOMER_SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}
