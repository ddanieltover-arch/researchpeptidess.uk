import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAccountOrdersRead } from '../../src/server/commerce-http';
import { handleCustomerApiRequest } from '../../src/server/customer-http';

export const config = { runtime: 'nodejs' };

function withAccountPrefix(req: IncomingMessage): string {
  const raw = (req.url || '').split('?')[0] || '/';
  if (raw.startsWith('/api/account')) return raw;
  if (raw.startsWith('/account')) return `/api${raw}`;
  const rest = raw.startsWith('/') ? raw : `/${raw}`;
  return `/api/account${rest === '/' ? '' : rest}`;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const path = withAccountPrefix(req);
  const query = (req.url || '').includes('?') ? req.url!.slice(req.url!.indexOf('?')) : '';
  req.url = path + query;

  if (path === '/api/account/orders') {
    await handleAccountOrdersRead(req, res);
    return;
  }
  await handleCustomerApiRequest(req, res);
}
