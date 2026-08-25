import type { IncomingMessage, ServerResponse } from 'node:http';
import { logServerError, readCorrelationId, readJsonBody, sendJson, sendPublicError, type NodeRequest } from '../src/server/http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const correlationId = readCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);
  if (req.method !== 'POST') {
    sendPublicError(res, 405, correlationId, 'Method not allowed.');
    return;
  }
  const body = await readJsonBody(req as NodeRequest);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const consent = body.consent === true;
  const topics = Array.isArray(body.topics) ? body.topics.filter((item) => typeof item === 'string') : [];
  if (!consent) {
    sendPublicError(res, 422, correlationId, 'Consent is required before a subscription record can be stored.');
    return;
  }
  if (!email.includes('@')) {
    sendPublicError(res, 400, correlationId, 'Enter a valid email address.');
    return;
  }
  try {
    const { upsertNewsletterSubscription } = await import('../src/server/persist/newsletter');
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
    logServerError({ correlationId, route: '/api/newsletter', operation: 'newsletter_upsert', error });
    sendPublicError(res, 500, correlationId, 'The subscription could not be stored. Reference: ' + correlationId);
  }
}
