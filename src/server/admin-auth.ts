/**
 * Node-only admin authentication. Do not import from the Vite SPA bundle.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { createDb, getDatabaseConfig } from '../db/index';
import { users } from '../db/schema';
import { ADMIN_SESSION_COOKIE, AdminSessionUser } from '../lib/admin-session';
import { getDummyPasswordHash, hashPassword, safeStringEqual, verifyPassword } from './password';

const DEFAULT_ADMIN_EMAIL = 'info@researchpeptidess.uk';
const PLACEHOLDER_SECRETS = new Set([
  '',
  'your-64-character-cryptographically-secure-random-secret',
  'your-session-encryption-secret-string',
  'your-jwt-hmac-sha256-signing-key',
]);

interface AdminAuthConfig {
  adminEmail: string;
  allowlist: Set<string>;
  adminPassword: string;
  adminName: string;
  signingKey: string;
  expiryDays: number;
}

interface SessionPayload {
  v: 1;
  sub: string;
  email: string;
  name: string;
  role: 'ADMIN';
  iat: number;
  exp: number;
}

export interface AuthenticatedAdmin {
  user: AdminSessionUser;
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
  const signingKey =
    process.env.AUTH_SECRET || process.env.JWT_SIGNING_KEY || process.env.SESSION_SECRET || '';
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

function toSessionUser(user: { id: string; email: string; name: string }): AdminSessionUser {
  return {
    id: user.id,
    email: normalizeEmail(user.email),
    name: user.name,
    role: 'ADMIN',
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
    if (payload.v !== 1 || payload.role !== 'ADMIN' || payload.exp * 1000 < Date.now()) {
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
    },
    config.signingKey
  );
}

export function readAdminSessionFromCookieHeader(cookieHeader: string | undefined): AdminSessionUser | null {
  const config = getAdminAuthConfig();
  if (!config.signingKey || PLACEHOLDER_SECRETS.has(config.signingKey)) {
    return null;
  }
  const cookies = parseCookieHeader(cookieHeader);
  const token = cookies[ADMIN_SESSION_COOKIE];
  if (!token) return null;
  const payload = verifyToken(token, config.signingKey);
  if (!payload || !isAdminEmailAllowed(payload.email, config)) return null;
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

async function findUserByEmail(email: string) {
  const { isConfigured } = getDatabaseConfig();
  if (!isConfigured) return null;
  const db = createDb();
  const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return row ?? null;
}

async function upsertAdminUser(params: {
  email: string;
  name: string;
  passwordHash: string;
  existingId?: string;
}): Promise<AdminSessionUser> {
  const db = createDb();
  const now = new Date();
  const id = params.existingId || `usr_admin_${params.email.replace(/[^a-z0-9]+/g, '_').replace(/_+$/g, '')}`;

  await db
    .insert(users)
    .values({
      id,
      email: params.email,
      passwordHash: params.passwordHash,
      name: params.name,
      role: 'ADMIN',
      institution: 'Research Peptides UK',
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        passwordHash: params.passwordHash,
        name: params.name,
        role: 'ADMIN',
        updatedAt: now,
      },
    });

  return toSessionUser({ id, email: params.email, name: params.name });
}

export async function authenticateAdmin(emailInput: string, password: string): Promise<AuthenticatedAdmin | { error: string }> {
  const config = getAdminAuthConfig();
  const email = normalizeEmail(emailInput);

  if (!config.signingKey || PLACEHOLDER_SECRETS.has(config.signingKey)) {
    return { error: 'Admin authentication is not configured on the server.' };
  }

  if (!email || !password) {
    return { error: 'Invalid email or password.' };
  }

  const dummyHash = await getDummyPasswordHash();
  const allowed = isAdminEmailAllowed(email, config);
  const existing = allowed ? await findUserByEmail(email).catch(() => null) : null;

  if (existing?.passwordHash) {
    const hashMatches = await verifyPassword(password, existing.passwordHash);
    const envMatches = Boolean(config.adminPassword) && safeStringEqual(password, config.adminPassword);
    if (!hashMatches && !envMatches) {
      return { error: 'Invalid email or password.' };
    }
    if (existing.role !== 'ADMIN') {
      return { error: 'Invalid email or password.' };
    }
    if (!hashMatches && envMatches) {
      const nextHash = await hashPassword(password);
      const user = await upsertAdminUser({
        email,
        name: existing.name || config.adminName,
        passwordHash: nextHash,
        existingId: existing.id,
      });
      return { user };
    }
    return { user: toSessionUser(existing) };
  }

  await verifyPassword(password, dummyHash);

  if (!allowed || !config.adminPassword || !safeStringEqual(password, config.adminPassword)) {
    return { error: 'Invalid email or password.' };
  }

  const passwordHash = await hashPassword(password);
  try {
    const user = await upsertAdminUser({
      email,
      name: config.adminName,
      passwordHash,
    });
    return { user };
  } catch {
    return {
      user: toSessionUser({
        id: `usr_admin_${email.replace(/[^a-z0-9]+/g, '_')}`,
        email,
        name: config.adminName,
      }),
    };
  }
}

export function getSessionCookieMaxAge(config = getAdminAuthConfig()): number {
  return config.expiryDays * 24 * 60 * 60;
}

export function isSecureCookieRequest(protocolHeader?: string, hostHeader?: string): boolean {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') return true;
  if ((protocolHeader || '').includes('https')) return true;
  return Boolean(hostHeader && !hostHeader.includes('localhost') && !hostHeader.startsWith('127.'));
}
