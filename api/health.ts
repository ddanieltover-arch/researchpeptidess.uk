import type { IncomingMessage, ServerResponse } from 'node:http';
import { writeHealthResponse } from '../src/server/health-handlers';
import { readCorrelationId } from '../src/server/http';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Method not allowed.' }));
    return;
  }
  await writeHealthResponse(res, readCorrelationId(req));
}
