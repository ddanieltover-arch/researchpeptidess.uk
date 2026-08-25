import type { IncomingMessage, ServerResponse } from 'node:http';
import { getClientAddress, hashIp, logServerError, readCorrelationId, readJsonBody, sendJson, sendPublicError } from '../src/server/http';
import { createContactMessage } from '../src/server/persist/contact';

export const config = { runtime: 'nodejs' };

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const correlationId = readCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);
  if (req.method !== 'POST') {
    sendPublicError(res, 405, correlationId, 'Method not allowed.');
    return;
  }
  try {
    const body = await readJsonBody(req);
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const subject = typeof body.subject === 'string' ? body.subject.trim() : 'Operations enquiry';
    const consent = body.consent === true;
    const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey : undefined;
    if (!consent) {
      sendPublicError(res, 422, correlationId, 'Consent is required before this enquiry can be stored.');
      return;
    }
    if (!name || !email.includes('@') || !message) {
      sendPublicError(res, 400, correlationId, 'Name, email, and message are required.');
      return;
    }
    const result = await createContactMessage({
      name,
      email,
      subject,
      message,
      consent,
      idempotencyKey,
      ipHash: hashIp(getClientAddress(req)),
    });
    if (!result.duplicate) {
      try {
        const { dispatchContactEmails } = await import('../src/server/email/dispatch');
        await dispatchContactEmails(result.record, correlationId);
      } catch (error) {
        logServerError({ correlationId, route: '/api/contact', operation: 'contact_email_dispatch', error });
      }
    }
    sendJson(res, result.duplicate ? 200 : 201, { enquiry: result.record, duplicate: result.duplicate });
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMITED') {
      sendPublicError(res, 429, correlationId, 'Too many enquiries from this network. Try again later.');
      return;
    }
    logServerError({ correlationId, route: '/api/contact', operation: 'contact_create', error });
    sendPublicError(res, 500, correlationId, 'The enquiry could not be stored. Reference: ' + correlationId);
  }
}
