/**
 * Shared Node HTTP handlers for /api/admin/* (Vite middleware and Vercel functions).
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  authenticateAdmin,
  buildExpiredSessionCookie,
  buildSessionCookie,
  createAdminSessionToken,
  getAdminAuthConfig,
  getSessionCookieMaxAge,
  isSecureCookieRequest,
  readAdminSessionFromCookieHeader,
} from './admin-auth';
import { clearLoginAttempts, consumeLoginAttempt, getClientAddress } from './rate-limit';
import { requestPath } from './http';

type NodeRequest = IncomingMessage & { body?: unknown };

function sendJson(res: ServerResponse, status: number, body: unknown, extraHeaders?: Record<string, string>): void {
  if (res.headersSent) return;
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (extraHeaders) {
    for (const [key, value] of Object.entries(extraHeaders)) {
      res.setHeader(key, value);
    }
  }
  res.end(JSON.stringify(body));
}

function readRawBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function readJsonBody(req: NodeRequest): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body as Record<string, unknown>;
  }
  if (typeof req.body === 'string' && req.body.trim()) {
    return JSON.parse(req.body) as Record<string, unknown>;
  }
  const raw = await readRawBody(req);
  if (!raw.trim()) return {};
  return JSON.parse(raw) as Record<string, unknown>;
}

function cookieSecure(req: IncomingMessage): boolean {
  const proto = String(req.headers['x-forwarded-proto'] || '');
  const host = String(req.headers.host || '');
  return isSecureCookieRequest(proto, host);
}

export async function handleAdminLogin(req: NodeRequest, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  const ip = getClientAddress(req);
  const throttle = consumeLoginAttempt(`login:${ip}`);
  if (!throttle.allowed) {
    sendJson(res, 429, { error: 'Too many sign-in attempts. Please try again later.' }, {
      'Retry-After': String(throttle.retryAfterSeconds),
    });
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
    const result = await authenticateAdmin(email, password);
    if ('error' in result) {
      sendJson(res, 401, { error: result.error });
      return;
    }

    clearLoginAttempts(`login:${ip}`);
    const config = getAdminAuthConfig();
    const token = createAdminSessionToken(result.user, config);
    sendJson(res, 200, { user: result.user }, {
      'Set-Cookie': buildSessionCookie(token, getSessionCookieMaxAge(config), cookieSecure(req)),
    });
  } catch {
    sendJson(res, 500, { error: 'Authentication service unavailable.' });
  }
}

export async function handleAdminLogout(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST' && req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }
  sendJson(res, 200, { ok: true }, {
    'Set-Cookie': buildExpiredSessionCookie(cookieSecure(req)),
  });
}

export async function handleAdminSession(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }
  const user = readAdminSessionFromCookieHeader(req.headers.cookie);
  sendJson(res, 200, { user });
}

export async function handleAdminApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const path = requestPath(req);
  if (!path.startsWith('/api/admin')) return false;

  try {
    if (path === '/api/admin/login') {
      await handleAdminLogin(req, res);
      return true;
    }
    if (path === '/api/admin/logout') {
      await handleAdminLogout(req, res);
      return true;
    }
    if (path === '/api/admin/session') {
      await handleAdminSession(req, res);
      return true;
    }
    sendJson(res, 404, { error: 'Not found.' });
    return true;
  } catch {
    sendJson(res, 500, { error: 'Authentication service unavailable.' });
    return true;
  }
}
