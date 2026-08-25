import type { IncomingMessage, ServerResponse } from 'node:http';

export const config = { runtime: 'nodejs' };

function withAccountPrefix(req: IncomingMessage): string {
  const raw = (req.url || '').split('?')[0] || '/';
  if (raw.startsWith('/api/account')) return raw;
  if (raw.startsWith('/account')) return `/api${raw}`;
  const rest = raw.startsWith('/') ? raw : `/${raw}`;
  return `/api/account${rest === '/' ? '' : rest}`;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const path = withAccountPrefix(req);
    const query = (req.url || '').includes('?') ? req.url!.slice(req.url!.indexOf('?')) : '';
    req.url = path + query;
    if (path === '/api/account/orders') {
      const { handleAccountOrdersRead } = await import('../../src/server/commerce-http');
      await handleAccountOrdersRead(req, res);
      return;
    }
    const { handleCustomerApiRequest } = await import('../../src/server/customer-http');
    await handleCustomerApiRequest(req, res);
  } catch {
    if (res.headersSent) return;
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ user: null, error: 'Account service unavailable.', stage: 'module_load' }));
  }
}
