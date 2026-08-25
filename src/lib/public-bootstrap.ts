import { MerchandisingRecord } from './merchandising-persistence';
import { PublicSettlementSnapshot } from './settlement-instructions';
import { ShippingMethod, StoreSettings } from '../types';

export type BootstrapSectionStatus = 'ok' | 'unavailable' | 'fallback';

export interface PublicBootstrapPayload {
  merchandising: MerchandisingRecord[];
  storeSettings: StoreSettings | null;
  shippingMethods: ShippingMethod[];
  newsletter: { providerConnected: boolean; providerStatus: string };
  settlement: PublicSettlementSnapshot;
  degraded: boolean;
  sections: {
    merchandising: BootstrapSectionStatus;
    settings: BootstrapSectionStatus;
    shipping: BootstrapSectionStatus;
    settlement: BootstrapSectionStatus;
  };
  reference?: string;
}

export function isPublicBootstrapSafe(body: Record<string, unknown>): boolean {
  const privateKeys = ['orders', 'payments', 'inventoryTransactions', 'customers', 'users'];
  return privateKeys.every((key) => !(key in body));
}
