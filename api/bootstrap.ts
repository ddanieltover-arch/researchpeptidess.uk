export const config = { runtime: 'nodejs' };

function send(
  res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b: string) => void },
  body: unknown
): void {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

const empty = {
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
};

export default async function handler(
  req: { method?: string },
  res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b: string) => void }
): Promise<void> {
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    send(res, { error: 'Method not allowed.' });
    return;
  }

  try {
    const [{ listMerchandising }, { loadStoreSettings }, { listShippingMethods }, { loadCommerceState }, { isEmailProviderConnected }, { getPublicSettlementSnapshot }] =
      await Promise.all([
        import('../src/server/persist/merchandising'),
        import('../src/server/persist/settings'),
        import('../src/server/persist/shipping'),
        import('../src/server/persist/commerce'),
        import('../src/server/env-status'),
        import('../src/lib/settlement-instructions'),
      ]);

    const [merchandising, storeSettings, shipping, commerce] = await Promise.all([
      listMerchandising(),
      loadStoreSettings(),
      listShippingMethods(),
      loadCommerceState(),
    ]);

    send(res, {
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
    });
  } catch {
    send(res, empty);
  }
}
