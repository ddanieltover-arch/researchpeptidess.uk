import type { IncomingMessage, ServerResponse } from 'node:http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const { readCorrelationId, readJsonBody, sendJson, sendPublicError, getClientAddress, hashIp, logServerError } = await import('../src/server/http');
    const correlationId = readCorrelationId(req);
    res.setHeader('x-correlation-id', correlationId);
    if (req.method !== 'POST') {
      sendPublicError(res, 405, correlationId, 'Method not allowed.');
      return;
    }
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
    const { createContactMessage } = await import('../src/server/persist/contact');
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
    if (res.headersSent) return;
    if (error instanceof Error && error.message === 'RATE_LIMITED') {
      res.statusCode = 429;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Too many enquiries from this network. Try again later.' }));
      return;
    }
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'The enquiry could not be stored.', stage: 'contact_create' }));
  }
}
