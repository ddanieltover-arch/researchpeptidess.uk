import { CustomerSessionUser, isCustomerSessionUser } from './customer-session';
import { toRenderableText } from './react-text';

function asApiErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') {
    return typeof body === 'string' && body.trim() ? body : fallback;
  }
  const record = body as { error?: unknown; message?: unknown };
  const fromError = toRenderableText(record.error);
  if (fromError) return fromError;
  const fromMessage = toRenderableText(record.message);
  if (fromMessage) return fromMessage;
  return fallback;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return {};
  }
}

export async function fetchCustomerSession(): Promise<CustomerSessionUser | null> {
  const response = await fetch('/api/account/session', {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) return null;
  const body = (await readJson(response)) as { user?: unknown };
  return isCustomerSessionUser(body.user) ? body.user : null;
}

export async function loginCustomer(
  email: string,
  password: string
): Promise<{ user: CustomerSessionUser } | { error: string }> {
  const response = await fetch('/api/account/login', {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const body = await readJson(response);
  const record = (body && typeof body === 'object' ? body : {}) as { user?: unknown };
  if (!response.ok || !isCustomerSessionUser(record.user)) {
    return { error: asApiErrorMessage(body, 'Invalid email or password.') };
  }
  return { user: record.user };
}

export async function registerCustomer(input: {
  name: string;
  email: string;
  password: string;
  institution?: string;
}): Promise<{ user: CustomerSessionUser } | { error: string }> {
  const response = await fetch('/api/account/register', {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  const body = await readJson(response);
  const record = (body && typeof body === 'object' ? body : {}) as { user?: unknown };
  if (!response.ok || !isCustomerSessionUser(record.user)) {
    return { error: asApiErrorMessage(body, 'Unable to create this account.') };
  }
  return { user: record.user };
}

export async function logoutCustomer(): Promise<void> {
  await fetch('/api/account/logout', {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
}
