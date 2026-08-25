import type { IncomingMessage, ServerResponse } from 'node:http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const { readCorrelationId, readJsonBody, sendJson, sendPublicError } = await import('../src/server/http');
    const correlationId = readCorrelationId(req);
    res.setHeader('x-correlation-id', correlationId);
    if (req.method !== 'POST') {
      sendPublicError(res, 405, correlationId, 'Method not allowed.');
      return;
    }
    const body = await readJsonBody(req);
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
  } catch {
    if (res.headersSent) return;
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'The subscription could not be stored.', stage: 'newsletter_upsert' }));
  }
}
