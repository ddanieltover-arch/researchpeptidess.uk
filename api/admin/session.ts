export const config = { runtime: 'nodejs' };

function send(res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b: string) => void }, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export default async function handler(
  req: { method?: string },
  res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b: string) => void; headersSent?: boolean }
): Promise<void> {
  try {
    const { handleAdminSession } = await import('../../src/server/admin-http');
    await handleAdminSession(req as never, res as never);
  } catch {
    if (res.headersSent) return;
    send(res, 200, { user: null });
  }
}
