/**
 * Dedicated Vercel order-create function.
 * Lives under api/ and only imports api/_lib so it compiles and boots.
 */

import { persistOrderBundle } from './_lib/orders';

export const config = { runtime: 'nodejs' };

type Res = {
  statusCode: number;
  setHeader: (k: string, v: string) => void;
  end: (b: string) => void;
  headersSent?: boolean;
};

type Req = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
};

function send(res: Res, status: number, body: unknown, correlationId?: string): void {
  if (res.headersSent) return;
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (correlationId) res.setHeader('x-correlation-id', correlationId);
  res.end(JSON.stringify(body));
}

function correlationId(req: Req): string {
  const header = req.headers?.['x-correlation-id'];
  const raw = Array.isArray(header) ? header[0] : header;
  if (raw && /^RP-ERR-[A-F0-9]{4}$/i.test(String(raw).trim())) return String(raw).trim().toUpperCase();
  const hex = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');
  return `RP-ERR-${hex}`;
}

async function readBody(req: Req): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body as Record<string, unknown>;
  }
  if (typeof req.body === 'string' && req.body.trim()) {
    return JSON.parse(req.body) as Record<string, unknown>;
  }
  return {};
}

export default async function handler(req: Req, res: Res): Promise<void> {
  const ref = correlationId(req);
  try {
    if (req.method !== 'POST') {
      send(res, 405, { error: 'Method not allowed.', reference: ref }, ref);
      return;
    }

    let body: Record<string, unknown>;
    try {
      body = await readBody(req);
    } catch {
      send(res, 400, { error: 'Order and payment payloads are required.', reference: ref }, ref);
      return;
    }

    const order = body.order as { id?: string } | undefined;
    const payment = body.payment as { id?: string } | undefined;
    const inventory = Array.isArray(body.inventory) ? body.inventory : [];
    const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey : undefined;

    if (!order?.id || !payment?.id) {
      send(res, 400, { error: 'Order and payment payloads are required.', reference: ref }, ref);
      return;
    }

    const result = await persistOrderBundle({
      order: body.order as never,
      payment: body.payment as never,
      inventory: inventory as never,
      idempotencyKey,
      userId: null,
    });

    send(
      res,
      result.duplicate ? 200 : 201,
      { order: result.order, payment: result.payment, duplicate: result.duplicate, reference: ref },
      ref
    );
  } catch (error) {
    const detail = (error instanceof Error ? error.message : 'order_failed').slice(0, 160);
    send(res, 500, { error: 'The order could not be stored. Reference: ' + ref, reference: ref, detail }, ref);
  }
}
