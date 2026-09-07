import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAdminSession } from '../../src/server/admin-http';

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
    await handleAdminSession(req, res);
  } catch {
    if (res.headersSent) return;
    send(res, 200, { user: null });
  }
}
