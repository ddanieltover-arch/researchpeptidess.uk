/**
 * Node-only admin authentication. Do not import from the Vite SPA bundle.
 * Cookie HMAC helpers live in session-cookies so persist routes can boot without Drizzle.
 */

import { eq } from 'drizzle-orm';
import { createDb, getDatabaseConfig } from '../db/index';
import { users } from '../db/schema';
import { AdminSessionUser } from '../lib/admin-session';
import { getDummyPasswordHash, hashPassword, safeStringEqual, verifyPassword } from './password';
import {
  getAdminAuthConfig,
  isAdminEmailAllowed,
  normalizeEmail,
} from './session-cookies';

export {
  buildExpiredSessionCookie,
  buildSessionCookie,
  createAdminSessionToken,
  getAdminAuthConfig,
  getSessionCookieMaxAge,
  isAdminEmailAllowed,
  isSecureCookieRequest,
  normalizeEmail,
  parseCookieHeader,
  readAdminSessionFromCookieHeader,
} from './session-cookies';

export interface AuthenticatedAdmin {
  user: AdminSessionUser;
}

function toSessionUser(user: { id: string; email: string; name: string }): AdminSessionUser {
  return {
    id: user.id,
    email: normalizeEmail(user.email),
    name: user.name,
    role: 'ADMIN',
  };
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

  if (!config.signingKey) {
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
