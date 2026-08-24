/**
 * Client-safe customer session types. Password hashing lives in src/server only.
 */

import { UserRole } from '../types';

export const CUSTOMER_SESSION_COOKIE = 'rpuk_customer_session';
export const ACCOUNT_LOGIN_PATH = '/account/login';
export const ACCOUNT_HOME_PATH = '/account';

export interface CustomerSessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  institution?: string;
  phone?: string;
}

export function isCustomerSessionUser(value: unknown): value is CustomerSessionUser {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as CustomerSessionUser;
  const role = candidate.role;
  return (
    (role === 'CUSTOMER' || role === 'ADMIN' || role === 'ANALYST') &&
    typeof candidate.id === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.name === 'string'
  );
}
