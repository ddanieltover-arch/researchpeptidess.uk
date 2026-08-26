import type { IncomingMessage, ServerResponse } from 'node:http';
import { runLazyApi, vercelNodeConfig } from '../../src/server/lazy-api';

export const config = vercelNodeConfig;

function withAdminPrefix(req: IncomingMessage): string {
  const raw = (req.url || '').split('?')[0] || '/';
  if (raw.startsWith('/api/admin')) return raw;
  if (raw.startsWith('/admin')) return `/api${raw}`;
  const rest = raw.startsWith('/') ? raw : `/${raw}`;
  return `/api/admin${rest === '/' ? '' : rest}`;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const path = withAdminPrefix(req);
  const query = (req.url || '').includes('?') ? req.url!.slice(req.url!.indexOf('?')) : '';
  req.url = path + query;

  await runLazyApi(
    req,
    res,
    async () => {
      if (path === '/api/admin/orders') {
        if (req.method === 'GET') {
          const { handleAdminCommerceRead } = await import('../../src/server/commerce-http');
          return handleAdminCommerceRead;
        }
        const { handleAdminOrderUpdate } = await import('../../src/server/order-http');
        return handleAdminOrderUpdate;
      }
      if (path === '/api/admin/merchandising') {
        const { handleAdminMerchandising } = await import('../../src/server/admin-persist-http');
        return handleAdminMerchandising;
      }
      if (path === '/api/admin/store-settings') {
        const { handleAdminStoreSettings } = await import('../../src/server/admin-persist-http');
        return handleAdminStoreSettings;
      }
      if (path === '/api/admin/shipping') {
        const { handleAdminShipping } = await import('../../src/server/admin-persist-http');
        return handleAdminShipping;
      }
      if (path === '/api/admin/env-status') {
        const { handleAdminEnvStatus } = await import('../../src/server/admin-persist-http');
        return handleAdminEnvStatus;
      }
      const { handleAdminApiRequest } = await import('../../src/server/admin-http');
      return handleAdminApiRequest;
    },
    'The admin request could not be completed.'
  );
}
