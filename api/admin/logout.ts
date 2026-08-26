export const config = { runtime: 'nodejs' };

function send(
  res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b: string) => void; headersSent?: boolean },
  status: number,
  body: unknown,
  extraHeaders?: Record<string, string>
): void {
  if (res.headersSent) return;
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (extraHeaders) {
    for (const [key, value] of Object.entries(extraHeaders)) {
      res.setHeader(key, value);
    }
  }
  res.end(JSON.stringify(body));
}

export default async function handler(
  req: { method?: string; headers?: unknown; url?: string },
  res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b: string) => void; headersSent?: boolean }
): Promise<void> {
  try {
    const { handleAdminLogout } = await import('../../src/server/admin-http');
    await handleAdminLogout(req as never, res as never);
  } catch {
    if (res.headersSent) return;
    send(res, 200, { ok: true });
  }
}
