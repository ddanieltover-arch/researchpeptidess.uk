/**
 * Single API dispatcher for Vite middleware and the Vercel catch-all function.
 * Persist/auth modules are loaded lazily so the router can boot without Drizzle.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildEnvDiagnostic, isEmailProviderConnected } from './env-status';
import {
  getClientAddress,
  hashIp,
  logServerError,
  readCorrelationId,
  readJsonBody,
  requestPath,
  sendJson,
  sendPublicError,
  type NodeRequest,
} from './http';
import { InventoryTransaction, Order, Payment, ShippingMethod, StoreSettings } from '../types';
import { getPublicSettlementSnapshot } from '../lib/settlement-instructions';

async function requireAdmin(req: IncomingMessage, res: ServerResponse, correlationId: string): Promise<boolean> {
  const { readAdminSessionFromCookieHeader } = await import('./admin-auth');
  const user = readAdminSessionFromCookieHeader(req.headers.cookie);
  if (!user) {
    sendPublicError(res, 401, correlationId, 'Administrator authentication is required.');
    return false;
  }
  return true;
}

async function handleBootstrap(res: ServerResponse, correlationId: string): Promise<void> {
  try {
    const [{ listMerchandising }, { loadStoreSettings }, { listShippingMethods }, { loadCommerceState }] =
      await Promise.all([
        import('./persist/merchandising'),
        import('./persist/settings'),
        import('./persist/shipping'),
        import('./persist/commerce'),
      ]);
    const [merchandising, storeSettings, shipping, commerce] = await Promise.all([
      listMerchandising(),
      loadStoreSettings(),
      listShippingMethods(),
      loadCommerceState(),
    ]);
    sendJson(
      res,
      200,
      {
        merchandising,
        storeSettings,
        shippingMethods: shipping,
        orders: commerce.orders,
        payments: commerce.payments,
        inventoryTransactions: commerce.inventoryTransactions,
        newsletter: {
          providerConnected: isEmailProviderConnected(),
          providerStatus: isEmailProviderConnected()
            ? 'PROVIDER_CONFIGURED_NOT_SENDING'
            : 'NOT_CONNECTED_TO_EMAIL_PROVIDER',
        },
        settlement: getPublicSettlementSnapshot(),
      },
      { 'x-correlation-id': correlationId }
    );
  } catch (error) {
    logServerError({ correlationId, route: '/api/bootstrap', operation: 'bootstrap', error });
    sendJson(
      res,
      200,
      {
        merchandising: [],
        storeSettings: null,
        shippingMethods: [],
        orders: [],
        payments: [],
        inventoryTransactions: [],
        newsletter: {
          providerConnected: false,
          providerStatus: 'NOT_CONNECTED_TO_EMAIL_PROVIDER',
        },
        settlement: {
          bank: { configured: false, accountName: '', bankName: '', sortCode: '', accountNumber: '' },
          crypto: { configured: false, network: 'BTC', walletAddress: '' },
        },
        degraded: true,
        reference: correlationId,
      },
      { 'x-correlation-id': correlationId }
    );
  }
}

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const path = requestPath(req);
  if (!path.startsWith('/api/')) return false;

  const correlationId = readCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);

  try {
    if (path === '/api/health' && req.method === 'GET') {
      const { writeHealthResponse } = await import('./health-handlers');
      await writeHealthResponse(res, correlationId);
      return true;
    }
    if (path === '/api/ready' && req.method === 'GET') {
      const { writeReadyResponse } = await import('./health-handlers');
      await writeReadyResponse(res, correlationId);
      return true;
    }
    if (path === '/api/bootstrap' && req.method === 'GET') {
      await handleBootstrap(res, correlationId);
      return true;
    }

    if (path.startsWith('/api/admin/login') || path.startsWith('/api/admin/logout') || path.startsWith('/api/admin/session')) {
      const { handleAdminApiRequest } = await import('./admin-http');
      return handleAdminApiRequest(req, res);
    }

    if (path.startsWith('/api/account/')) {
      const { handleCustomerApiRequest } = await import('./customer-http');
      return handleCustomerApiRequest(req, res);
    }

    if (path === '/api/contact' && req.method === 'POST') {
      const body = await readJsonBody(req as NodeRequest);
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const message = typeof body.message === 'string' ? body.message.trim() : '';
      const subject = typeof body.subject === 'string' ? body.subject.trim() : 'Operations enquiry';
      const consent = body.consent === true;
      const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey : undefined;
      if (!consent) {
        sendPublicError(res, 422, correlationId, 'Consent is required before this enquiry can be stored.');
        return true;
      }
      if (!name || !email.includes('@') || !message) {
        sendPublicError(res, 400, correlationId, 'Name, email, and message are required.');
        return true;
      }
      try {
        const { createContactMessage } = await import('./persist/contact');
        const result = await createContactMessage({
          name,
          email,
          subject,
          message,
          consent,
          idempotencyKey,
          ipHash: hashIp(getClientAddress(req)),
        });
        sendJson(res, result.duplicate ? 200 : 201, { enquiry: result.record, duplicate: result.duplicate });
      } catch (error) {
        if (error instanceof Error && error.message === 'RATE_LIMITED') {
          sendPublicError(res, 429, correlationId, 'Too many enquiries from this network. Try again later.');
          return true;
        }
        logServerError({ correlationId, route: path, operation: 'contact_create', error });
        sendPublicError(res, 500, correlationId, 'The enquiry could not be stored. Reference: ' + correlationId);
      }
      return true;
    }

    if (path === '/api/newsletter' && req.method === 'POST') {
      const body = await readJsonBody(req as NodeRequest);
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const consent = body.consent === true;
      const topics = Array.isArray(body.topics) ? body.topics.filter((item) => typeof item === 'string') : [];
      if (!consent) {
        sendPublicError(res, 422, correlationId, 'Consent is required before a subscription record can be stored.');
        return true;
      }
      if (!email.includes('@')) {
        sendPublicError(res, 400, correlationId, 'Enter a valid email address.');
        return true;
      }
      try {
        const { upsertNewsletterSubscription } = await import('./persist/newsletter');
        const result = await upsertNewsletterSubscription({
          email,
          topics: topics.length > 0 ? (topics as string[]) : ['NEW_CATALOGUE'],
          consentSource: 'storefront_newsletter_form',
        });
        sendJson(res, 200, {
          subscription: result.record,
          created: result.created,
          providerStatus: result.record.providerStatus,
        });
      } catch (error) {
        logServerError({ correlationId, route: path, operation: 'newsletter_upsert', error });
        sendPublicError(res, 500, correlationId, 'The subscription could not be stored. Reference: ' + correlationId);
      }
      return true;
    }

    if (path === '/api/orders' && req.method === 'POST') {
      const body = await readJsonBody(req as NodeRequest);
      const order = body.order as Order | undefined;
      const payment = body.payment as Payment | undefined;
      const inventory = Array.isArray(body.inventory) ? (body.inventory as InventoryTransaction[]) : [];
      const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey : undefined;
      if (!order?.id || !payment?.id) {
        sendPublicError(res, 400, correlationId, 'Order and payment payloads are required.');
        return true;
      }
      try {
        const { persistOrderBundle } = await import('./persist/commerce');
        const result = await persistOrderBundle({ order, payment, inventory, idempotencyKey });
        sendJson(res, result.duplicate ? 200 : 201, result);
      } catch (error) {
        logServerError({ correlationId, route: path, operation: 'order_create', error });
        sendPublicError(res, 500, correlationId, 'The order could not be stored. Reference: ' + correlationId);
      }
      return true;
    }

    if (path === '/api/orders/payment' && req.method === 'POST') {
      const body = await readJsonBody(req as NodeRequest);
      const order = body.order as Order | undefined;
      const payment = body.payment as Payment | undefined;
      if (!order?.id || !payment?.id) {
        sendPublicError(res, 400, correlationId, 'Order and payment payloads are required.');
        return true;
      }
      try {
        const { persistPaymentUpdate } = await import('./persist/commerce');
        await persistPaymentUpdate(payment, order);
        sendJson(res, 200, { ok: true });
      } catch (error) {
        logServerError({ correlationId, route: path, operation: 'payment_update', error });
        sendPublicError(res, 500, correlationId, 'Payment state could not be stored. Reference: ' + correlationId);
      }
      return true;
    }

    if (path === '/api/inventory' && req.method === 'POST') {
      if (!(await requireAdmin(req, res, correlationId))) return true;
      const body = await readJsonBody(req as NodeRequest);
      const event = body.event as InventoryTransaction | undefined;
      if (!event?.id || !event.variantId) {
        sendPublicError(res, 400, correlationId, 'Inventory event is required.');
        return true;
      }
      try {
        const { persistInventoryEvent } = await import('./persist/commerce');
        await persistInventoryEvent(event);
        sendJson(res, 200, { ok: true });
      } catch (error) {
        logServerError({ correlationId, route: path, operation: 'inventory_event', error });
        sendPublicError(res, 500, correlationId, 'Inventory could not be stored. Reference: ' + correlationId);
      }
      return true;
    }

    if (path === '/api/admin/merchandising' && req.method === 'GET') {
      if (!(await requireAdmin(req, res, correlationId))) return true;
      const { listMerchandising } = await import('./persist/merchandising');
      const rows = await listMerchandising();
      sendJson(res, 200, { merchandising: rows });
      return true;
    }

    if (path === '/api/admin/merchandising' && req.method === 'PUT') {
      if (!(await requireAdmin(req, res, correlationId))) return true;
      const { readAdminSessionFromCookieHeader } = await import('./admin-auth');
      const session = readAdminSessionFromCookieHeader(req.headers.cookie);
      const body = await readJsonBody(req as NodeRequest);
      const productId = typeof body.productId === 'string' ? body.productId : '';
      if (!productId) {
        sendPublicError(res, 400, correlationId, 'productId is required.');
        return true;
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
            merchandisingPriority:
              typeof body.merchandisingPriority === 'number' ? body.merchandisingPriority : undefined,
          },
          actor: session?.email || 'admin',
          actorId: session?.id,
        });
        sendJson(res, 200, { merchandising: record });
      } catch (error) {
        logServerError({ correlationId, route: path, operation: 'merchandising_upsert', error });
        sendPublicError(res, 500, correlationId, 'Merchandising could not be stored. Reference: ' + correlationId);
      }
      return true;
    }

    if (path === '/api/admin/store-settings' && req.method === 'PUT') {
      if (!(await requireAdmin(req, res, correlationId))) return true;
      const { readAdminSessionFromCookieHeader } = await import('./admin-auth');
      const session = readAdminSessionFromCookieHeader(req.headers.cookie);
      const body = await readJsonBody(req as NodeRequest);
      const settings = body.settings as StoreSettings | undefined;
      if (!settings?.storeName) {
        sendPublicError(res, 400, correlationId, 'Store settings payload is required.');
        return true;
      }
      try {
        const { saveStoreSettings } = await import('./persist/settings');
        const saved = await saveStoreSettings(settings, session?.email);
        sendJson(res, 200, { storeSettings: saved });
      } catch (error) {
        logServerError({ correlationId, route: path, operation: 'store_settings_save', error });
        sendPublicError(res, 500, correlationId, 'Store settings could not be stored. Reference: ' + correlationId);
      }
      return true;
    }

    if (path === '/api/admin/shipping' && req.method === 'PUT') {
      if (!(await requireAdmin(req, res, correlationId))) return true;
      const body = await readJsonBody(req as NodeRequest);
      const id = typeof body.id === 'string' ? body.id : '';
      const updates = (body.updates || {}) as Partial<ShippingMethod>;
      if (!id) {
        sendPublicError(res, 400, correlationId, 'Shipping method id is required.');
        return true;
      }
      try {
        const { updateShippingMethodRecord } = await import('./persist/shipping');
        const saved = await updateShippingMethodRecord(id, updates);
        if (!saved) {
          sendPublicError(res, 404, correlationId, 'Shipping method not found.');
          return true;
        }
        sendJson(res, 200, { shippingMethod: saved });
      } catch (error) {
        logServerError({ correlationId, route: path, operation: 'shipping_update', error });
        sendPublicError(res, 500, correlationId, 'Shipping configuration could not be stored. Reference: ' + correlationId);
      }
      return true;
    }

    if (path === '/api/admin/env-status' && req.method === 'GET') {
      if (!(await requireAdmin(req, res, correlationId))) return true;
      sendJson(res, 200, { variables: buildEnvDiagnostic() });
      return true;
    }

    if (path.startsWith('/api/admin')) {
      sendPublicError(res, 404, correlationId, 'Not found.');
      return true;
    }

    sendPublicError(res, 404, correlationId, 'Not found.');
    return true;
  } catch (error) {
    logServerError({ correlationId, route: path, operation: 'dispatch', error });
    sendPublicError(res, 500, correlationId, 'The request could not be completed. Reference: ' + correlationId);
    return true;
  }
}
