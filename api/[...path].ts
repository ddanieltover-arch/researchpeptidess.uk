import type { IncomingMessage, ServerResponse } from 'node:http';
import { dispatchVercelApi } from '../src/server/vercel-handler';

export const config = { runtime: 'nodejs' };

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    await dispatchVercelApi(req, res, 'The request could not be completed.');
  } catch (error) {
    if (res.headersSent) return;
    const detail = (error instanceof Error ? error.message : 'load_failed')
      .replace(/postgres(?:ql)?:\/\/\S+/gi, '[redacted]')
      .replace(/postgresql:\/\/\S+/gi, '[redacted]')
      .slice(0, 160);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ error: 'The request could not be completed.', detail }));
  }
}
