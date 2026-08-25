/**
 * Customer account HTTP handlers for /api/account/*.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  authenticateCustomer,
  buildCustomerSessionCookie,
  buildExpiredCustomerSessionCookie,
  createCustomerSessionToken,
  isSecureCookieRequest,
  readCustomerSessionFromCookieHeader,
  registerCustomerAccount,
} from './customer-auth';
import { getAdminAuthConfig } from './admin-auth';
import { getClientAddress, readJsonBody, requestPath, sendJson, type NodeRequest } from './http';
import { clearLoginAttempts, consumeLoginAttempt } from './rate-limit';

function cookieSecure(req: IncomingMessage): boolean {
  const proto = String(req.headers['x-forwarded-proto'] || '');
  const host = String(req.headers.host || '');
  return isSecureCookieRequest(proto, host);
}

function sessionCookieHeader(token: string, req: IncomingMessage): string {
  const maxAge = getAdminAuthConfig().expiryDays * 24 * 60 * 60;
  return buildCustomerSessionCookie(token, maxAge, cookieSecure(req));
}

export async function handleCustomerLogin(req: NodeRequest, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  const ip = getClientAddress(req);
  const throttle = consumeLoginAttempt(`customer-login:${ip}`);
  if (!throttle.allowed) {
    sendJson(
      res,
      429,
      { error: 'Too many sign-in attempts. Please try again later.' },
      { 'Retry-After': String(throttle.retryAfterSeconds) }
    );
    return;
  }

  let email = '';
  let password = '';
  try {
    const body = await readJsonBody(req);
    email = typeof body.email === 'string' ? body.email : '';
    password = typeof body.password === 'string' ? body.password : '';
  } catch {
    sendJson(res, 400, { error: 'Invalid email or password.' });
    return;
  }

  try {
    const result = await authenticateCustomer(email, password);
    if ('error' in result) {
      sendJson(res, 401, { error: result.error });
      return;
    }
    clearLoginAttempts(`customer-login:${ip}`);
    const token = createCustomerSessionToken(result.user);
    sendJson(res, 200, { user: result.user }, { 'Set-Cookie': sessionCookieHeader(token, req) });
  } catch {
    sendJson(res, 500, { error: 'Authentication service unavailable.' });
  }
}

export async function handleCustomerRegister(req: NodeRequest, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  const ip = getClientAddress(req);
  const throttle = consumeLoginAttempt(`customer-register:${ip}`);
  if (!throttle.allowed) {
    sendJson(
      res,
      429,
      { error: 'Too many registration attempts. Please try again later.' },
      { 'Retry-After': String(throttle.retryAfterSeconds) }
    );
    return;
  }

  let name = '';
  let email = '';
  let password = '';
  let institution = '';
  try {
    const body = await readJsonBody(req);
    name = typeof body.name === 'string' ? body.name : '';
    email = typeof body.email === 'string' ? body.email : '';
    password = typeof body.password === 'string' ? body.password : '';
    institution = typeof body.institution === 'string' ? body.institution : '';
  } catch {
    sendJson(res, 400, { error: 'Unable to create this account.' });
    return;
  }

  try {
    const result = await registerCustomerAccount({ name, email, password, institution });
    if ('error' in result) {
      sendJson(res, 400, { error: result.error });
      return;
    }
    clearLoginAttempts(`customer-register:${ip}`);
    try {
      const { dispatchAccountEmails } = await import('./email/dispatch');
      await dispatchAccountEmails(
        { name: result.user.name, email: result.user.email, institution: result.user.institution },
        undefined
      );
    } catch {
      /* Account creation must succeed even if mail dispatch fails. */
    }
    const token = createCustomerSessionToken(result.user);
    sendJson(res, 201, { user: result.user }, { 'Set-Cookie': sessionCookieHeader(token, req) });
  } catch {
    sendJson(res, 500, { error: 'Account service unavailable.' });
  }
}

export async function handleCustomerLogout(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST' && req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }
  sendJson(res, 200, { ok: true }, { 'Set-Cookie': buildExpiredCustomerSessionCookie(cookieSecure(req)) });
}

export async function handleCustomerSession(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }
  const user = readCustomerSessionFromCookieHeader(req.headers.cookie);
  sendJson(res, 200, { user });
}

export async function handleCustomerApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const path = requestPath(req);
  if (!path.startsWith('/api/account')) return false;

  try {
    if (path === '/api/account/login') {
      await handleCustomerLogin(req, res);
      return true;
    }
    if (path === '/api/account/register') {
      await handleCustomerRegister(req, res);
      return true;
    }
    if (path === '/api/account/logout') {
      await handleCustomerLogout(req, res);
      return true;
    }
    if (path === '/api/account/session') {
      await handleCustomerSession(req, res);
      return true;
    }
    sendJson(res, 404, { error: 'Not found.' });
    return true;
  } catch {
    sendJson(res, 500, { error: 'Authentication service unavailable.' });
    return true;
  }
}
