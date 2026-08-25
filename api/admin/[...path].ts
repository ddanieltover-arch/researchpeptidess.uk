import type { IncomingMessage, ServerResponse } from 'node:http';

export const config = { runtime: 'nodejs' };

function withAdminPrefix(req: IncomingMessage): string {
  const raw = (req.url || '').split('?')[0] || '/';
  if (raw.startsWith('/api/admin')) return raw;
  if (raw.startsWith('/admin')) return `/api${raw}`;
  const rest = raw.startsWith('/') ? raw : `/${raw}`;
  return `/api/admin${rest === '/' ? '' : rest}`;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const path = withAdminPrefix(req);
    const query = (req.url || '').includes('?') ? req.url!.slice(req.url!.indexOf('?')) : '';
    req.url = path + query;
    if (path === '/api/admin/orders') {
      const { handleAdminCommerceRead } = await import('../../src/server/commerce-http');
      await handleAdminCommerceRead(req, res);
      return;
    }
    if (path === '/api/admin/merchandising') {
      const { handleAdminMerchandising } = await import('../../src/server/admin-persist-http');
      await handleAdminMerchandising(req, res);
      return;
    }
    if (path === '/api/admin/store-settings') {
      const { handleAdminStoreSettings } = await import('../../src/server/admin-persist-http');
      await handleAdminStoreSettings(req, res);
      return;
    }
    if (path === '/api/admin/shipping') {
      const { handleAdminShipping } = await import('../../src/server/admin-persist-http');
      await handleAdminShipping(req, res);
      return;
    }
    if (path === '/api/admin/env-status') {
      const { handleAdminEnvStatus } = await import('../../src/server/admin-persist-http');
      await handleAdminEnvStatus(req, res);
      return;
    }
    const { handleAdminApiRequest } = await import('../../src/server/admin-http');
    await handleAdminApiRequest(req, res);
  } catch {
    if (res.headersSent) return;
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Administrator service unavailable.', stage: 'module_load' }));
  }
}
