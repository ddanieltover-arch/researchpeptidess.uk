import type { IncomingMessage, ServerResponse } from 'node:http';
import { InventoryTransaction, NotificationType, Order, Payment } from '../types';
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
import { persistInventoryEvent, persistOrderBundle, persistPaymentUpdate, persistTrustedOrderUpdate } from './persist/commerce';

function asNotificationType(value: unknown): NotificationType | undefined {
  const allowed: NotificationType[] = [
    'ORDER_RECEIVED',
    'PAYMENT_INSTRUCTIONS',
    'PAYMENT_SUBMITTED',
    'PAYMENT_VERIFIED',
    'PAYMENT_REJECTED',
    'ORDER_PROCESSING',
    'ORDER_SHIPPED',
    'ORDER_DELIVERED',
    'ORDER_CANCELLED',
    'REFUND_PROCESSED',
  ];
  return typeof value === 'string' && allowed.includes(value as NotificationType)
    ? (value as NotificationType)
    : undefined;
}

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
    if (!result.duplicate) {
      try {
        const { dispatchOrderCreatedEmails } = await import('./email/dispatch');
        await dispatchOrderCreatedEmails(result.order, result.payment, correlationId);
      } catch (error) {
        logServerError({ correlationId, route: '/api/orders', operation: 'order_email_dispatch', error });
      }
    }
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
    const admin = readAdminSessionFromCookieHeader(req.headers.cookie);
    if (admin) {
      await persistTrustedOrderUpdate(order, payment);
      try {
        const { dispatchInferredOrderEmails } = await import('./email/dispatch');
        await dispatchInferredOrderEmails(order, payment, undefined, correlationId);
      } catch (error) {
        logServerError({ correlationId, route: '/api/orders/payment', operation: 'order_email_dispatch', error });
      }
    } else {
      await persistPaymentUpdate(payment, order);
      try {
        const { dispatchOrderEventEmails } = await import('./email/dispatch');
        await dispatchOrderEventEmails('PAYMENT_SUBMITTED', order, payment, correlationId);
      } catch (error) {
        logServerError({ correlationId, route: '/api/orders/payment', operation: 'order_email_dispatch', error });
      }
    }
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

export async function handleOrderLifecycleUpdate(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const correlationId = readCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);
  if (req.method !== 'PUT' && req.method !== 'POST') {
    sendPublicError(res, 405, correlationId, 'Method not allowed.');
    return;
  }

  const admin = readAdminSessionFromCookieHeader(req.headers.cookie);
  const customer = readCustomerSessionFromCookieHeader(req.headers.cookie);
  const body = await readJsonBody(req as NodeRequest);
  const order = body.order as Order | undefined;
  const payment = body.payment as Payment | undefined;
  const eventType = asNotificationType(body.eventType);
  if (!order?.id) {
    sendPublicError(res, 400, correlationId, 'Order payload is required.');
    return;
  }

  const customerOwnsOrder =
    Boolean(customer) &&
    (order.customerId === customer?.id ||
      order.customerEmail.trim().toLowerCase() === customer?.email.trim().toLowerCase());
  const customerCancelling = customerOwnsOrder && order.status === 'CANCELLED';
  if (!admin && !customerCancelling) {
    sendPublicError(res, 401, correlationId, 'Administrator authentication is required.');
    return;
  }

  try {
    await persistTrustedOrderUpdate(order, payment);
    try {
      const { dispatchInferredOrderEmails } = await import('./email/dispatch');
      await dispatchInferredOrderEmails(
        order,
        payment,
        eventType || (customerCancelling ? 'ORDER_CANCELLED' : undefined),
        correlationId
      );
    } catch (error) {
      logServerError({ correlationId, route: '/api/orders/lifecycle', operation: 'order_email_dispatch', error });
    }
    sendJson(res, 200, { ok: true }, { 'x-correlation-id': correlationId });
  } catch (error) {
    const classified = classifyPersistError(error);
    logServerError({ correlationId, route: '/api/orders/lifecycle', operation: classified.stage, error });
    sendPublicError(res, 500, correlationId, 'Order could not be updated. Reference: ' + correlationId, {
      stage: classified.stage,
      classification: classified.classification,
    });
  }
}

export const handleAdminOrderUpdate = handleOrderLifecycleUpdate;
