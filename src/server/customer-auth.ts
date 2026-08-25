/**
 * Node-only customer authentication. Do not import from the Vite SPA bundle.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { createDb, getDatabaseConfig } from '../db/index';
import { users } from '../db/schema';
import { UserRole } from '../types';
import { CUSTOMER_SESSION_COOKIE, CustomerSessionUser } from '../lib/customer-session';
import {
  getAdminAuthConfig,
  isAdminEmailAllowed,
  isSecureCookieRequest,
  normalizeEmail,
  parseCookieHeader,
} from './admin-auth';
import { getDummyPasswordHash, hashPassword, verifyPassword } from './password';

const PLACEHOLDER_SECRETS = new Set([
  '',
  'your-64-character-cryptographically-secure-random-secret',
  'your-session-encryption-secret-string',
  'your-jwt-hmac-sha256-signing-key',
]);

interface SessionPayload {
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

function getSigningKey(): string {
  return getAdminAuthConfig().signingKey;
}

function toSessionUser(row: {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  institution?: string | null;
  phone?: string | null;
}): CustomerSessionUser {
  return {
    id: row.id,
    email: normalizeEmail(row.email),
    name: row.name,
    role: row.role,
    institution: row.institution || undefined,
    phone: row.phone || undefined,
  };
}

function signPayload(payload: SessionPayload, signingKey: string): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', signingKey).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function verifyToken(token: string, signingKey: string): SessionPayload | null {
  const [encoded, signature] = (token || '').split('.');
  if (!encoded || !signature) return null;

  const expected = createHmac('sha256', signingKey).update(encoded).digest('base64url');
  const given = Buffer.from(signature);
  const good = Buffer.from(expected);
  if (given.length !== good.length || !timingSafeEqual(given, good)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    const validRole = payload.role === 'CUSTOMER' || payload.role === 'ADMIN' || payload.role === 'ANALYST';
    if (payload.v !== 1 || !validRole || payload.exp * 1000 < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
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
    },
    config.signingKey
  );
}

export function readCustomerSessionFromCookieHeader(cookieHeader: string | undefined): CustomerSessionUser | null {
  const signingKey = getSigningKey();
  if (!signingKey || PLACEHOLDER_SECRETS.has(signingKey)) return null;
  const token = parseCookieHeader(cookieHeader)[CUSTOMER_SESSION_COOKIE];
  if (!token) return null;
  const payload = verifyToken(token, signingKey);
  if (!payload) return null;
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

async function findUserByEmail(email: string) {
  const { isConfigured } = getDatabaseConfig();
  if (!isConfigured) return null;
  const db = createDb();
  const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return row ?? null;
}

export async function authenticateCustomer(
  emailInput: string,
  password: string
): Promise<{ user: CustomerSessionUser } | { error: string }> {
  const email = normalizeEmail(emailInput);
  const dummyHash = await getDummyPasswordHash();

  if (!email || !password) {
    await verifyPassword(password || 'x', dummyHash);
    return { error: 'Invalid email or password.' };
  }

  const existing = await findUserByEmail(email).catch(() => null);
  if (!existing?.passwordHash) {
    await verifyPassword(password, dummyHash);
    return { error: 'Invalid email or password.' };
  }

  const matches = await verifyPassword(password, existing.passwordHash);
  if (!matches) {
    return { error: 'Invalid email or password.' };
  }

  return { user: toSessionUser(existing) };
}

export async function registerCustomerAccount(input: {
  name: string;
  email: string;
  password: string;
  institution?: string;
}): Promise<{ user: CustomerSessionUser } | { error: string }> {
  const email = normalizeEmail(input.email);
  const name = (input.name || '').trim();
  const institution = (input.institution || '').trim();
  const password = input.password || '';

  if (name.length < 2 || name.length > 120) {
    return { error: 'Enter the name that should appear on laboratory orders.' };
  }
  if (!email.includes('@') || email.length > 254) {
    return { error: 'Enter a valid email address.' };
  }
  if (password.length < 8 || password.length > 200) {
    return { error: 'Password must be at least 8 characters.' };
  }
  if (isAdminEmailAllowed(email)) {
    return { error: 'This email is reserved. Use the admin sign-in page instead.' };
  }

  const { isConfigured } = getDatabaseConfig();
  if (!isConfigured) {
    return { error: 'Account service is unavailable.' };
  }

  const existing = await findUserByEmail(email).catch(() => null);
  if (existing) {
    return { error: 'An account with this email already exists. Sign in instead.' };
  }

  const now = new Date();
  const id = `usr_${email.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40)}_${Date.now().toString(36)}`;
  const passwordHash = await hashPassword(password);
  const db = createDb();

  try {
    await db.insert(users).values({
      id,
      email,
      passwordHash,
      name,
      role: 'CUSTOMER',
      institution: institution || null,
      createdAt: now,
      updatedAt: now,
    });
  } catch {
    return { error: 'An account with this email already exists. Sign in instead.' };
  }

  return {
    user: toSessionUser({
      id,
      email,
      name,
      role: 'CUSTOMER',
      institution: institution || null,
    }),
  };
}

export { isSecureCookieRequest };
