import type { IncomingMessage, ServerResponse } from 'node:http';
import { runLazyApi, vercelNodeConfig } from '../../src/server/lazy-api';

export const config = vercelNodeConfig;

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

  await runLazyApi(
    req,
    res,
    async () => {
      if (path === '/api/account/orders') {
        const { handleAccountOrdersRead } = await import('../../src/server/commerce-http');
        return handleAccountOrdersRead;
      }
      const { handleCustomerApiRequest } = await import('../../src/server/customer-http');
      return handleCustomerApiRequest;
    },
    'The account request could not be completed.'
  );
}
