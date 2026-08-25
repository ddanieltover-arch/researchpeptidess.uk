import { MerchandisingRecord } from './merchandising-persistence';
import { InventoryTransaction, Order, Payment, ShippingMethod, StoreSettings } from '../types';
import { PublicBootstrapPayload } from './public-bootstrap';

async function readJson(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function fetchBootstrap(): Promise<PublicBootstrapPayload | null> {
  try {
    const response = await fetch('/api/bootstrap', { headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    return (await readJson(response)) as unknown as PublicBootstrapPayload;
  } catch {
    return null;
  }
}

export async function fetchAdminCommerce(): Promise<{
  orders: Order[];
  payments: Payment[];
  inventoryTransactions: InventoryTransaction[];
} | null> {
  try {
    const response = await fetch('/api/admin/orders', {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    return (await readJson(response)) as {
      orders: Order[];
      payments: Payment[];
      inventoryTransactions: InventoryTransaction[];
    };
  } catch {
    return null;
  }
}

export async function fetchAccountOrders(): Promise<{ orders: Order[]; payments: Payment[] } | null> {
  try {
    const response = await fetch('/api/account/orders', {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    return (await readJson(response)) as { orders: Order[]; payments: Payment[] };
  } catch {
    return null;
  }
}

export async function persistMerchandising(
  productId: string,
  patch: Partial<MerchandisingRecord>
): Promise<{ ok: boolean; record?: MerchandisingRecord; reference?: string }> {
  try {
    const response = await fetch('/api/admin/merchandising', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ productId, ...patch }),
    });
    const body = await readJson(response);
    if (!response.ok) {
      return { ok: false, reference: typeof body.reference === 'string' ? body.reference : undefined };
    }
    return { ok: true, record: body.merchandising as MerchandisingRecord };
  } catch {
    return { ok: false };
  }
}

export async function persistStoreSettingsRequest(
  settings: StoreSettings
): Promise<{ ok: boolean; reference?: string }> {
  try {
    const response = await fetch('/api/admin/store-settings', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ settings }),
    });
    const body = await readJson(response);
    return {
      ok: response.ok,
      reference: typeof body.reference === 'string' ? body.reference : undefined,
    };
  } catch {
    return { ok: false };
  }
}

export async function persistShippingRequest(
  id: string,
  updates: Partial<ShippingMethod>
): Promise<{ ok: boolean; reference?: string }> {
  try {
    const response = await fetch('/api/admin/shipping', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id, updates }),
    });
    const body = await readJson(response);
    return {
      ok: response.ok,
      reference: typeof body.reference === 'string' ? body.reference : undefined,
    };
  } catch {
    return { ok: false };
  }
}

export async function persistOrderRequest(params: {
  order: Order;
  payment: Payment;
  inventory: InventoryTransaction[];
  idempotencyKey: string;
}): Promise<{ ok: boolean; duplicate?: boolean; reference?: string }> {
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(params),
    });
    const body = await readJson(response);
    return {
      ok: response.ok,
      duplicate: body.duplicate === true,
      reference: typeof body.reference === 'string' ? body.reference : undefined,
    };
  } catch {
    return { ok: false };
  }
}

export async function persistAdminOrderRequest(
  order: Order,
  payment?: Payment,
  eventType?: string
): Promise<{ ok: boolean; reference?: string }> {
  try {
    const response = await fetch('/api/orders/lifecycle', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ order, payment, eventType }),
    });
    const body = await readJson(response);
    return {
      ok: response.ok,
      reference: typeof body.reference === 'string' ? body.reference : undefined,
    };
  } catch {
    return { ok: false };
  }
}

export async function persistPaymentRequest(order: Order, payment: Payment): Promise<{ ok: boolean; reference?: string }> {
  try {
    const response = await fetch('/api/orders/payment', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ order, payment }),
    });
    const body = await readJson(response);
    return {
      ok: response.ok,
      reference: typeof body.reference === 'string' ? body.reference : undefined,
    };
  } catch {
    return { ok: false };
  }
}

export async function persistInventoryRequest(
  event: InventoryTransaction
): Promise<{ ok: boolean; reference?: string }> {
  try {
    const response = await fetch('/api/inventory', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ event }),
    });
    const body = await readJson(response);
    return {
      ok: response.ok,
      reference: typeof body.reference === 'string' ? body.reference : undefined,
    };
  } catch {
    return { ok: false };
  }
}

export async function submitContactRequest(input: {
  name: string;
  email: string;
  message: string;
  subject?: string;
  consent: boolean;
  idempotencyKey: string;
}): Promise<{ ok: boolean; reason?: string; reference?: string }> {
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(input),
    });
    const body = await readJson(response);
    if (!response.ok) {
      return {
        ok: false,
        reason: typeof body.error === 'string' ? body.error : 'Enquiry could not be stored.',
        reference: typeof body.reference === 'string' ? body.reference : undefined,
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: 'Enquiry could not be stored.' };
  }
}

export async function submitNewsletterRequest(input: {
  email: string;
  topics: string[];
  consent: boolean;
}): Promise<{ ok: boolean; reason?: string; providerStatus?: string; reference?: string }> {
  try {
    const response = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(input),
    });
    const body = await readJson(response);
    if (!response.ok) {
      return {
        ok: false,
        reason: typeof body.error === 'string' ? body.error : 'Subscription could not be stored.',
        reference: typeof body.reference === 'string' ? body.reference : undefined,
      };
    }
    return {
      ok: true,
      providerStatus: typeof body.providerStatus === 'string' ? body.providerStatus : undefined,
    };
  } catch {
    return { ok: false, reason: 'Subscription could not be stored.' };
  }
}
