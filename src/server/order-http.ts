import type { IncomingMessage, ServerResponse } from 'node:http';
import { InventoryTransaction, Order, Payment } from '../types';
import { classifyPersistError, recommendedPersistFix } from '../lib/persist-error';
import { readAdminSessionFromCookieHeader } from './admin-auth';
import { readCustomerSessionFromCookieHeader } from './customer-auth';
import {
  logServerError,
  readCorrelationId,
  readJsonBody,
  sendJson,
  sendPublicError,
  type NodeRequest,
} from './http';
import { persistInventoryEvent, persistOrderBundle, persistPaymentUpdate } from './persist/commerce';

function actorUserId(req: IncomingMessage): string | null {
  const customer = readCustomerSessionFromCookieHeader(req.headers.cookie);
  if (customer?.id) return customer.id;
  const admin = readAdminSessionFromCookieHeader(req.headers.cookie);
  if (admin?.id) return admin.id;
  return null;
}

export async function handleCreateOrder(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const correlationId = readCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);
  if (req.method !== 'POST') {
    sendPublicError(res, 405, correlationId, 'Method not allowed.');
    return;
  }

  let body: Record<string, unknown>;
  try {
    body = await readJsonBody(req as NodeRequest);
  } catch {
    sendPublicError(res, 400, correlationId, 'Order and payment payloads are required.', {
      stage: 'request_validation',
      classification: 'VALIDATION',
    });
    return;
  }

  const order = body.order as Order | undefined;
  const payment = body.payment as Payment | undefined;
  const inventory = Array.isArray(body.inventory) ? (body.inventory as InventoryTransaction[]) : [];
  const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey : undefined;
  if (!order?.id || !payment?.id) {
    sendPublicError(res, 400, correlationId, 'Order and payment payloads are required.', {
      stage: 'request_validation',
      classification: 'VALIDATION',
    });
    return;
  }

  try {
    const result = await persistOrderBundle({
      order,
      payment,
      inventory,
      idempotencyKey,
      userId: actorUserId(req),
    });
    sendJson(res, result.duplicate ? 200 : 201, result, { 'x-correlation-id': correlationId });
  } catch (error) {
    const classified = classifyPersistError(error);
    logServerError({ correlationId, route: '/api/orders', operation: classified.stage, error });
    sendPublicError(res, 500, correlationId, 'The order could not be stored. Reference: ' + correlationId, {
      stage: classified.stage,
      classification: classified.classification,
      recommendedFix: recommendedPersistFix(classified.classification),
    });
  }
}

export async function handlePaymentUpdate(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const correlationId = readCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);
  if (req.method !== 'POST') {
    sendPublicError(res, 405, correlationId, 'Method not allowed.');
    return;
  }
  const body = await readJsonBody(req as NodeRequest);
  const order = body.order as Order | undefined;
  const payment = body.payment as Payment | undefined;
  if (!order?.id || !payment?.id) {
    sendPublicError(res, 400, correlationId, 'Order and payment payloads are required.');
    return;
  }
  try {
    await persistPaymentUpdate(payment, order);
    sendJson(res, 200, { ok: true }, { 'x-correlation-id': correlationId });
  } catch (error) {
    const classified = classifyPersistError(error);
    logServerError({ correlationId, route: '/api/orders/payment', operation: classified.stage, error });
    sendPublicError(res, 500, correlationId, 'Payment state could not be stored. Reference: ' + correlationId, {
      stage: classified.stage,
      classification: classified.classification,
    });
  }
}

export async function handleInventoryEvent(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const correlationId = readCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);
  if (req.method !== 'POST') {
    sendPublicError(res, 405, correlationId, 'Method not allowed.');
    return;
  }
  const admin = readAdminSessionFromCookieHeader(req.headers.cookie);
  if (!admin) {
    sendPublicError(res, 401, correlationId, 'Administrator authentication is required.');
    return;
  }
  const body = await readJsonBody(req as NodeRequest);
  const event = body.event as InventoryTransaction | undefined;
  if (!event?.id || !event.variantId) {
    sendPublicError(res, 400, correlationId, 'Inventory event is required.');
    return;
  }
  try {
    await persistInventoryEvent(event);
    sendJson(res, 200, { ok: true }, { 'x-correlation-id': correlationId });
  } catch (error) {
    const classified = classifyPersistError(error);
    logServerError({ correlationId, route: '/api/inventory', operation: classified.stage, error });
    sendPublicError(res, 500, correlationId, 'Inventory could not be stored. Reference: ' + correlationId, {
      stage: classified.stage,
      classification: classified.classification,
    });
  }
}
