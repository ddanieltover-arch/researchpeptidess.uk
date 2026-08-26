import type { IncomingMessage, ServerResponse } from 'node:http';
import { readAdminSessionFromCookieHeader, readCustomerSessionFromCookieHeader } from './session-cookies';
import { readCorrelationId, sendJson, sendPublicError } from './http';
import { listCommerceForAdmin, listCommerceForCustomer } from './persist/commerce';

export async function handleAdminCommerceRead(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const correlationId = readCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);
  if (req.method !== 'GET') {
    sendPublicError(res, 405, correlationId, 'Method not allowed.');
    return;
  }
  const admin = readAdminSessionFromCookieHeader(req.headers.cookie);
  if (!admin) {
    sendPublicError(res, 401, correlationId, 'Administrator authentication is required.');
    return;
  }
  try {
    const snapshot = await listCommerceForAdmin();
    sendJson(res, 200, snapshot, { 'x-correlation-id': correlationId });
  } catch {
    sendPublicError(res, 500, correlationId, 'Commerce records could not be loaded. Reference: ' + correlationId);
  }
}

export async function handleAccountOrdersRead(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const correlationId = readCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);
  if (req.method !== 'GET') {
    sendPublicError(res, 405, correlationId, 'Method not allowed.');
    return;
  }
  const customer = readCustomerSessionFromCookieHeader(req.headers.cookie);
  const admin = readAdminSessionFromCookieHeader(req.headers.cookie);
  if (admin) {
    sendPublicError(res, 403, correlationId, 'Use the administrator commerce endpoint.');
    return;
  }
  if (!customer) {
    sendPublicError(res, 401, correlationId, 'Customer authentication is required.');
    return;
  }
  try {
    const snapshot = await listCommerceForCustomer(customer);
    sendJson(res, 200, snapshot, { 'x-correlation-id': correlationId });
  } catch {
    sendPublicError(res, 500, correlationId, 'Orders could not be loaded. Reference: ' + correlationId);
  }
}
