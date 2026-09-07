/**
 * Node-only admin authentication. Do not import from the Vite SPA bundle.
 * Uses Neon SQL (not Drizzle) so Vercel login functions can boot.
 */

import { AdminSessionUser } from '../lib/admin-session';
import { asRowArray, getNeonSqlOrNull, requireNeonSql } from './neon-sql';
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

interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  passwordHash: string;
}

function toSessionUser(user: { id: string; email: string; name: string }): AdminSessionUser {
  return {
    id: user.id,
    email: normalizeEmail(user.email),
    name: user.name,
    role: 'ADMIN',
  };
}

async function findUserByEmail(email: string): Promise<AdminUserRow | null> {
  const sql = getNeonSqlOrNull();
  if (!sql) return null;
  const rows = asRowArray(
    await sql`
      SELECT id, email, name, role::text AS role, password_hash AS "passwordHash"
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `
  );
  const row = rows[0];
  if (!row || typeof row.id !== 'string' || typeof row.email !== 'string') return null;
  return {
    id: row.id,
    email: row.email,
    name: typeof row.name === 'string' ? row.name : '',
    role: typeof row.role === 'string' ? row.role : 'CUSTOMER',
    passwordHash: typeof row.passwordHash === 'string' ? row.passwordHash : '',
  };
}

async function upsertAdminUser(params: {
  email: string;
  name: string;
  passwordHash: string;
  existingId?: string;
}): Promise<AdminSessionUser> {
  const sql = requireNeonSql();
  const now = new Date();
  const id = params.existingId || `usr_admin_${params.email.replace(/[^a-z0-9]+/g, '_').replace(/_+$/g, '')}`;

  await sql`
    INSERT INTO users (id, email, password_hash, name, role, institution, created_at, updated_at)
    VALUES (${id}, ${params.email}, ${params.passwordHash}, ${params.name}, 'ADMIN', 'Research Peptides UK', ${now}, ${now})
    ON CONFLICT (email) DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      name = EXCLUDED.name,
      role = 'ADMIN',
      updated_at = EXCLUDED.updated_at
  `;

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
      try {
        const user = await upsertAdminUser({
          email,
          name: existing.name || config.adminName,
          passwordHash: nextHash,
          existingId: existing.id,
        });
        return { user };
      } catch {
        return { user: toSessionUser(existing) };
      }
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
