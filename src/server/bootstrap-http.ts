import type { IncomingMessage, ServerResponse } from 'node:http';
import { logServerError, readCorrelationId } from './http';

function send(res: ServerResponse, status: number, body: unknown, correlationId?: string): void {
  if (res.headersSent) return;
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (correlationId) res.setHeader('x-correlation-id', correlationId);
  res.end(JSON.stringify(body));
}

export async function handleBootstrap(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const correlationId = readCorrelationId(req);
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, { error: 'Method not allowed.' }, correlationId);
    return;
  }
  try {
    const { loadPublicBootstrap } = await import('./persist/public-store');
    const payload = await loadPublicBootstrap(correlationId);
    send(res, 200, payload, correlationId);
  } catch (error) {
    logServerError({ correlationId, route: '/api/bootstrap', operation: 'bootstrap', error });
    send(
      res,
      200,
      {
        merchandising: [],
        storeSettings: null,
        shippingMethods: [],
        newsletter: {
          providerConnected: false,
          providerStatus: 'NOT_CONNECTED_TO_EMAIL_PROVIDER',
        },
        settlement: {
          bank: { configured: false, accountName: '', bankName: '', sortCode: '', accountNumber: '' },
          crypto: { configured: false, network: 'BTC', walletAddress: '' },
        },
        degraded: true,
        sections: {
          merchandising: 'unavailable',
          settings: 'unavailable',
          shipping: 'unavailable',
          settlement: 'unavailable',
        },
        reference: correlationId,
      },
      correlationId
    );
  }
}
