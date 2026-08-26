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

export default async function handler(
  req: { method?: string; headers?: unknown; url?: string; body?: unknown },
  res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b: string) => void; headersSent?: boolean }
): Promise<void> {
  try {
    const { handleAdminLogin } = await import('../../src/server/admin-http');
    await handleAdminLogin(req as never, res as never);
  } catch {
    if (res.headersSent) return;
    send(res, 503, { error: 'Authentication service unavailable.' });
  }
}
