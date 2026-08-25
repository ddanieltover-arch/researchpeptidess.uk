import type { IncomingMessage, ServerResponse } from 'node:http';

export const config = { runtime: 'nodejs' };

function send(
  res: ServerResponse,
  status: number,
  body: unknown,
  correlationId?: string
): void {
  if (res.headersSent) return;
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (correlationId) res.setHeader('x-correlation-id', correlationId);
  res.end(JSON.stringify(body));
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const { readCorrelationId } = await import('../src/server/http');
    const correlationId = readCorrelationId(req);
    if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
      send(res, 405, { error: 'Method not allowed.' }, correlationId);
      return;
    }
    const { loadPublicBootstrap } = await import('../src/server/persist/public-store');
    const payload = await loadPublicBootstrap(correlationId);
    send(res, 200, payload, correlationId);
  } catch (error) {
    send(res, 200, {
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
      errorType: error instanceof Error ? error.name : 'Error',
      detail: (error instanceof Error ? error.message : String(error)).replace(/postgres(?:ql)?:\/\/\S+/gi, '[redacted]').slice(0, 180),
    });
  }
}
