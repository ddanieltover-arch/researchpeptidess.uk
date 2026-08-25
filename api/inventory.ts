import type { IncomingMessage, ServerResponse } from 'node:http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const { handleInventoryEvent } = await import('../src/server/order-http');
    await handleInventoryEvent(req, res);
  } catch {
    if (res.headersSent) return;
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Inventory could not be stored.', stage: 'module_load' }));
  }
}
