/**
 * Server HTTP helpers. Sanitizes customer-facing errors. Logs correlation IDs internally.
 */

import { createHash, randomBytes } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

export type NodeRequest = IncomingMessage & { body?: unknown };

const SECRET_PATTERNS = [
  /postgres(?:ql)?:\/\/\S+/gi,
  /postgresql:\/\/\S+/gi,
  /password=[^&\s]+/gi,
  /secret=[^&\s]+/gi,
  /api[_-]?key=[^&\s]+/gi,
  /bearer\s+\S+/gi,
];

export function createCorrelationId(): string {
  return `RP-ERR-${randomBytes(2).toString('hex').toUpperCase()}`;
}

export function readCorrelationId(req: IncomingMessage): string {
  const header = req.headers['x-correlation-id'];
  const raw = Array.isArray(header) ? header[0] : header;
  if (raw && /^RP-ERR-[A-F0-9]{4}$/i.test(raw.trim())) {
    return raw.trim().toUpperCase();
  }
  return createCorrelationId();
}

export function requestPath(req: IncomingMessage): string {
  const url = req.url || '';
  const path = url.split('?')[0] || '/';
  if (path.startsWith('/api/')) return path;
  if (path.startsWith('/')) return `/api${path === '/' ? '' : path}`;
  return `/api/${path}`;
}

export function sanitizeErrorMessage(input: string): string {
  let message = input || 'Unexpected error';
  for (const pattern of SECRET_PATTERNS) {
    message = message.replace(pattern, '[redacted]');
  }
  return message.slice(0, 280);
}

export function logServerError(params: {
  correlationId: string;
  route: string;
  operation: string;
  error: unknown;
}): void {
  const err = params.error;
  const type = err instanceof Error ? err.name : 'Error';
  const message = sanitizeErrorMessage(err instanceof Error ? err.message : String(err));
  console.error(
    JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
      correlationId: params.correlationId,
      route: params.route,
      operation: params.operation,
      errorType: type,
      message,
    })
  );
}

export function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown,
  extraHeaders?: Record<string, string>
): void {
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

export function sendPublicError(
  res: ServerResponse,
  status: number,
  correlationId: string,
  message: string,
  extra?: Record<string, unknown>
): void {
  sendJson(res, status, {
    error: message,
    reference: correlationId,
    ...extra,
  }, {
    'x-correlation-id': correlationId,
  });
}

export function readRawBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export async function readJsonBody(req: NodeRequest): Promise<Record<string, unknown>> {
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

export function hashIp(ip: string): string {
  const pepper = process.env.AUTH_SECRET || process.env.SESSION_SECRET || 'rpuk-ip-hash';
  return createHash('sha256').update(`${pepper}:${ip}`).digest('hex').slice(0, 32);
}

export function getClientAddress(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (raw) return raw.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}
