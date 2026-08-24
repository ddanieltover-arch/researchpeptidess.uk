import type { IncomingMessage, ServerResponse } from 'node:http';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const { handleApiRequest } = await import('../src/server/api-router');
    const handled = await handleApiRequest(req, res);
    if (!handled && !res.headersSent) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Not found.' }));
    }
  } catch {
    if (res.headersSent) return;
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ error: 'Service unavailable.' }));
  }
}
