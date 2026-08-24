import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleApiRequest } from '../src/server/api-router';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const handled = await handleApiRequest(req, res);
  if (!handled && !res.headersSent) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Not found.' }));
  }
}
