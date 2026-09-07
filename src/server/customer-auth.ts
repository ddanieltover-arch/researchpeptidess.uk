/**
 * Node-only customer authentication. Do not import from the Vite SPA bundle.
 * Uses Neon SQL (not Drizzle) so Vercel account functions can boot.
 */

import { UserRole } from '../types';
import { CustomerSessionUser } from '../lib/customer-session';
import { asRowArray, getNeonSqlOrNull, requireNeonSql } from './neon-sql';
import { isAdminEmailAllowed, normalizeEmail } from './session-cookies';
import { getDummyPasswordHash, hashPassword, verifyPassword } from './password';

export {
  buildCustomerSessionCookie,
  buildExpiredCustomerSessionCookie,
  createCustomerSessionToken,
  readCustomerSessionFromCookieHeader,
} from './session-cookies';

export { isSecureCookieRequest } from './session-cookies';

interface CustomerUserRow {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  institution?: string | null;
  phone?: string | null;
  passwordHash: string;
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

function asUserRole(value: unknown): UserRole {
  if (value === 'ADMIN' || value === 'ANALYST' || value === 'CUSTOMER') return value;
  return 'CUSTOMER';
}

async function findUserByEmail(email: string): Promise<CustomerUserRow | null> {
  const sql = getNeonSqlOrNull();
  if (!sql) return null;
  const rows = asRowArray(
    await sql`
      SELECT
        id,
        email,
        name,
        role::text AS role,
        institution,
        phone,
        password_hash AS "passwordHash"
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
    role: asUserRole(row.role),
    institution: typeof row.institution === 'string' ? row.institution : null,
    phone: typeof row.phone === 'string' ? row.phone : null,
    passwordHash: typeof row.passwordHash === 'string' ? row.passwordHash : '',
  };
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

  if (!getNeonSqlOrNull()) {
    return { error: 'Account service is unavailable.' };
  }

  const existing = await findUserByEmail(email).catch(() => null);
  if (existing) {
    return { error: 'An account with this email already exists. Sign in instead.' };
  }

  const now = new Date();
  const id = `usr_${email.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40)}_${Date.now().toString(36)}`;
  const passwordHash = await hashPassword(password);
  const sql = requireNeonSql();

  try {
    await sql`
      INSERT INTO users (id, email, password_hash, name, role, institution, created_at, updated_at)
      VALUES (${id}, ${email}, ${passwordHash}, ${name}, 'CUSTOMER', ${institution || null}, ${now}, ${now})
    `;
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
