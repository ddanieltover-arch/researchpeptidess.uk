export const config = { runtime: 'nodejs' };

function send(
  res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b: string) => void; headersSent?: boolean },
  status: number,
  body: unknown
): void {
  if (res.headersSent) return;
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function loadError(error: unknown): string {
  const raw = error instanceof Error ? error.message : 'load_failed';
  return raw
    .replace(/postgres(?:ql)?:\/\/\S+/gi, '[redacted]')
    .replace(/postgresql:\/\/\S+/gi, '[redacted]')
    .slice(0, 160);
}

function withAdminPrefix(url?: string): string {
  const raw = (url || '').split('?')[0] || '/';
  if (raw.startsWith('/api/admin')) return raw;
  if (raw.startsWith('/admin')) return `/api${raw}`;
  const rest = raw.startsWith('/') ? raw : `/${raw}`;
  return `/api/admin${rest === '/' ? '' : rest}`;
}

export default async function handler(
  req: { method?: string; url?: string },
  res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b: string) => void; headersSent?: boolean }
): Promise<void> {
  const path = withAdminPrefix(req.url);
  const query = (req.url || '').includes('?') ? req.url!.slice(req.url!.indexOf('?')) : '';
  req.url = path + query;

  try {
    const { handleAdminApiRequest } = await import('../../src/server/admin-http');
    await handleAdminApiRequest(req as never, res as never);
  } catch (error) {
    send(res, 500, { error: 'The admin request could not be completed.', detail: loadError(error) });
  }
}
