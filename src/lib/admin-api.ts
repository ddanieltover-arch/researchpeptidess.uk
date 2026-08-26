import { AdminSessionUser, isAdminSessionUser } from './admin-session';
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

export async function fetchAdminSession(): Promise<AdminSessionUser | null> {
  const response = await fetch('/api/admin/session', {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) return null;
  const body = (await readJson(response)) as { user?: unknown };
  return isAdminSessionUser(body.user) ? body.user : null;
}

export async function loginAdmin(
  email: string,
  password: string
): Promise<{ user: AdminSessionUser } | { error: string }> {
  const response = await fetch('/api/admin/login', {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const body = await readJson(response);
  if (response.status >= 500) {
    return { error: 'Sign-in is temporarily unavailable. Please try again shortly.' };
  }
  const record = (body && typeof body === 'object' ? body : {}) as { user?: unknown };
  if (!response.ok || !isAdminSessionUser(record.user)) {
    return { error: asApiErrorMessage(body, 'Invalid email or password.') };
  }
  return { user: record.user };
}

export async function logoutAdmin(): Promise<void> {
  await fetch('/api/admin/logout', {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
}
