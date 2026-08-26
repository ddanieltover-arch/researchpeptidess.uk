/**
 * Node-only customer authentication. Do not import from the Vite SPA bundle.
 * Cookie HMAC helpers live in session-cookies so persist routes can boot without Drizzle.
 */

import { eq } from 'drizzle-orm';
import { createDb, getDatabaseConfig } from '../db/index';
import { users } from '../db/schema';
import { UserRole } from '../types';
import { CustomerSessionUser } from '../lib/customer-session';
import { isAdminEmailAllowed, normalizeEmail } from './session-cookies';
import { getDummyPasswordHash, hashPassword, verifyPassword } from './password';

export {
  buildCustomerSessionCookie,
  buildExpiredCustomerSessionCookie,
  createCustomerSessionToken,
  readCustomerSessionFromCookieHeader,
} from './session-cookies';

export { isSecureCookieRequest } from './session-cookies';

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
