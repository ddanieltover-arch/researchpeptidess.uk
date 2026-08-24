import { AdminSessionUser, isAdminSessionUser } from './admin-session';

interface ApiErrorBody {
  error?: string;
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
  const body = (await readJson(response)) as ApiErrorBody & { user?: unknown };
  if (!response.ok || !isAdminSessionUser(body.user)) {
    return { error: body.error || 'Invalid email or password.' };
  }
  return { user: body.user };
}

export async function logoutAdmin(): Promise<void> {
  await fetch('/api/admin/logout', {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
}
