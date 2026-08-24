/**
 * Client-safe admin session types and route helpers.
 * Password hashing, cookies, and allowlists live in src/server only.
 */

export const ADMIN_SESSION_COOKIE = 'rpuk_admin_session';

export interface AdminSessionUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN';
}

export const ADMIN_LOGIN_PATH = '/admin/login';
export const ADMIN_HOME_PATH = '/admin';

export function isAdminSessionUser(value: unknown): value is AdminSessionUser {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as AdminSessionUser;
  return (
    candidate.role === 'ADMIN' &&
    typeof candidate.id === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.name === 'string'
  );
}
