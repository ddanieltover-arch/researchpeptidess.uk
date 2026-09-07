/**
 * Self-contained admin logout for Vercel.
 * Intentionally imports nothing from src/.
 */

export const config = { runtime: 'nodejs' };

const COOKIE = 'rpuk_admin_session';

type Res = {
  statusCode: number;
  setHeader: (k: string, v: string) => void;
  end: (b: string) => void;
  headersSent?: boolean;
};

type Req = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
};

function isSecure(req: Req): boolean {
  const proto = String(req.headers?.['x-forwarded-proto'] || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  if (proto === 'https') return true;
  if (proto === 'http') return false;
  return process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
}

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Method not allowed.' }));
    return;
  }
  const parts = [`${COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (isSecure(req)) parts.push('Secure');
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Set-Cookie', parts.join('; '));
  res.end(JSON.stringify({ ok: true }));
}
