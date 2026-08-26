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
  req: { method?: string },
  res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b: string) => void; headersSent?: boolean }
): Promise<void> {
  try {
    const { handleAdminEnvStatus } = await import('../../src/server/admin-persist-http');
    await handleAdminEnvStatus(req as never, res as never);
  } catch (error) {
    const raw = error instanceof Error ? error.message : 'load_failed';
    send(res, 500, { error: 'The admin request could not be completed.', detail: raw.slice(0, 160) });
  }
}
