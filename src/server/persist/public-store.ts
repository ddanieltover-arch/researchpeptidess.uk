import { PublicBootstrapPayload } from '../../lib/public-bootstrap';
import { getPublicSettlementSnapshot } from '../../lib/settlement-instructions';
import { isEmailProviderConnected } from '../env-status';
import { listMerchandising } from './merchandising';
import { loadStoreSettings } from './settings';
import { listShippingMethods } from './shipping';

export async function loadPublicBootstrap(correlationId?: string): Promise<PublicBootstrapPayload> {
  const emptySettlement = getPublicSettlementSnapshot();
  const payload: PublicBootstrapPayload = {
    merchandising: [],
    storeSettings: null,
    shippingMethods: [],
    newsletter: {
      providerConnected: isEmailProviderConnected(),
      providerStatus: isEmailProviderConnected()
        ? 'CONNECTED'
        : 'NOT_CONNECTED_TO_EMAIL_PROVIDER',
    },
    settlement: emptySettlement,
    degraded: false,
    sections: {
      merchandising: 'ok',
      settings: 'ok',
      shipping: 'ok',
      settlement: 'ok',
    },
    reference: correlationId,
  };

  try {
    payload.merchandising = await listMerchandising();
  } catch {
    payload.sections.merchandising = 'unavailable';
  }

  try {
    payload.storeSettings = await loadStoreSettings();
  } catch {
    payload.sections.settings = 'unavailable';
    payload.storeSettings = null;
  }

  try {
    payload.shippingMethods = await listShippingMethods();
    if (!payload.shippingMethods.length) payload.sections.shipping = 'fallback';
  } catch {
    payload.sections.shipping = 'unavailable';
  }

  try {
    payload.settlement = getPublicSettlementSnapshot();
  } catch {
    payload.sections.settlement = 'unavailable';
  }

  payload.degraded = Object.values(payload.sections).every((status) => status === 'unavailable');
  return payload;
}
