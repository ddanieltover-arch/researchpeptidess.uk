import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAdminLogin } from '../../src/server/admin-http';

export const config = { runtime: 'nodejs' };

function send(
  res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b: string) => void; headersSent?: boolean },
  status: number,
  body: unknown
): void {
  if (res.headersSent) return;
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    await handleAdminLogin(req as never, res);
  } catch (error) {
    if (res.headersSent) return;
    const detail = (error instanceof Error ? error.message : 'load_failed')
      .replace(/postgres(?:ql)?:\/\/\S+/gi, '[redacted]')
      .replace(/postgresql:\/\/\S+/gi, '[redacted]')
      .slice(0, 160);
    send(res, 503, { error: 'Authentication service unavailable.', detail });
  }
}
