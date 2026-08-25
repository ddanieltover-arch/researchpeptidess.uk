import type { IncomingMessage, ServerResponse } from 'node:http';
import { ShippingMethod, StoreSettings } from '../types';
import { readAdminSessionFromCookieHeader } from './admin-auth';
import { buildEnvDiagnostic } from './env-status';
import { logServerError, readCorrelationId, readJsonBody, sendJson, sendPublicError, type NodeRequest } from './http';

async function requireAdmin(req: IncomingMessage, res: ServerResponse, correlationId: string): Promise<boolean> {
  const user = readAdminSessionFromCookieHeader(req.headers.cookie);
  if (!user) {
    sendPublicError(res, 401, correlationId, 'Administrator authentication is required.');
    return false;
  }
  return true;
}

export async function handleAdminMerchandising(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const correlationId = readCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);
  if (!(await requireAdmin(req, res, correlationId))) return;
  if (req.method === 'GET') {
    const { listMerchandising } = await import('./persist/merchandising');
    const rows = await listMerchandising();
    sendJson(res, 200, { merchandising: rows });
    return;
  }
  if (req.method !== 'PUT') {
    sendPublicError(res, 405, correlationId, 'Method not allowed.');
    return;
  }
  const session = readAdminSessionFromCookieHeader(req.headers.cookie);
  const body = await readJsonBody(req as NodeRequest);
  const productId = typeof body.productId === 'string' ? body.productId : '';
  if (!productId) {
    sendPublicError(res, 400, correlationId, 'productId is required.');
    return;
  }
  try {
    const { upsertMerchandising } = await import('./persist/merchandising');
    const record = await upsertMerchandising({
      productId,
      patch: {
        featured: typeof body.featured === 'boolean' ? body.featured : undefined,
        bestsellerOverride: typeof body.bestsellerOverride === 'boolean' ? body.bestsellerOverride : undefined,
        bestsellerExcluded: typeof body.bestsellerExcluded === 'boolean' ? body.bestsellerExcluded : undefined,
        newArrivalOverride: typeof body.newArrivalOverride === 'boolean' ? body.newArrivalOverride : undefined,
        hideFromHomepage: typeof body.hideFromHomepage === 'boolean' ? body.hideFromHomepage : undefined,
        merchandisingPriority: typeof body.merchandisingPriority === 'number' ? body.merchandisingPriority : undefined,
      },
      actor: session?.email || 'admin',
      actorId: session?.id,
    });
    sendJson(res, 200, { merchandising: record });
  } catch (error) {
    logServerError({ correlationId, route: '/api/admin/merchandising', operation: 'merchandising_upsert', error });
    sendPublicError(res, 500, correlationId, 'Merchandising could not be stored. Reference: ' + correlationId);
  }
}

export async function handleAdminStoreSettings(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const correlationId = readCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);
  if (req.method !== 'PUT') {
    sendPublicError(res, 405, correlationId, 'Method not allowed.');
    return;
  }
  if (!(await requireAdmin(req, res, correlationId))) return;
  const session = readAdminSessionFromCookieHeader(req.headers.cookie);
  const body = await readJsonBody(req as NodeRequest);
  const settings = body.settings as StoreSettings | undefined;
  if (!settings?.storeName) {
    sendPublicError(res, 400, correlationId, 'Store settings payload is required.');
    return;
  }
  try {
    const { saveStoreSettings } = await import('./persist/settings');
    const saved = await saveStoreSettings(settings, session?.email);
    sendJson(res, 200, { storeSettings: saved });
  } catch (error) {
    logServerError({ correlationId, route: '/api/admin/store-settings', operation: 'store_settings_save', error });
    sendPublicError(res, 500, correlationId, 'Store settings could not be stored. Reference: ' + correlationId);
  }
}

export async function handleAdminShipping(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const correlationId = readCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);
  if (req.method !== 'PUT') {
    sendPublicError(res, 405, correlationId, 'Method not allowed.');
    return;
  }
  if (!(await requireAdmin(req, res, correlationId))) return;
  const body = await readJsonBody(req as NodeRequest);
  const id = typeof body.id === 'string' ? body.id : '';
  const updates = (body.updates || {}) as Partial<ShippingMethod>;
  if (!id) {
    sendPublicError(res, 400, correlationId, 'Shipping method id is required.');
    return;
  }
  try {
    const { updateShippingMethodRecord } = await import('./persist/shipping');
    const saved = await updateShippingMethodRecord(id, updates);
    if (!saved) {
      sendPublicError(res, 404, correlationId, 'Shipping method not found.');
      return;
    }
    sendJson(res, 200, { shippingMethod: saved });
  } catch (error) {
    logServerError({ correlationId, route: '/api/admin/shipping', operation: 'shipping_update', error });
    sendPublicError(res, 500, correlationId, 'Shipping configuration could not be stored. Reference: ' + correlationId);
  }
}

export async function handleAdminEnvStatus(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const correlationId = readCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);
  if (req.method !== 'GET') {
    sendPublicError(res, 405, correlationId, 'Method not allowed.');
    return;
  }
  if (!(await requireAdmin(req, res, correlationId))) return;
  sendJson(res, 200, { variables: buildEnvDiagnostic() });
}
