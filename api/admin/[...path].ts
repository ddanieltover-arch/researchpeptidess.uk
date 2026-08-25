import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAdminApiRequest } from '../../src/server/admin-http';
import {
  handleAdminEnvStatus,
  handleAdminMerchandising,
  handleAdminShipping,
  handleAdminStoreSettings,
} from '../../src/server/admin-persist-http';
import { handleAdminCommerceRead } from '../../src/server/commerce-http';

export const config = { runtime: 'nodejs' };

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

  if (path === '/api/admin/orders') {
    await handleAdminCommerceRead(req, res);
    return;
  }
  if (path === '/api/admin/merchandising') {
    await handleAdminMerchandising(req, res);
    return;
  }
  if (path === '/api/admin/store-settings') {
    await handleAdminStoreSettings(req, res);
    return;
  }
  if (path === '/api/admin/shipping') {
    await handleAdminShipping(req, res);
    return;
  }
  if (path === '/api/admin/env-status') {
    await handleAdminEnvStatus(req, res);
    return;
  }
  await handleAdminApiRequest(req, res);
}
