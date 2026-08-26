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

export default async function handler(
  req: { method?: string },
  res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b: string) => void; headersSent?: boolean }
): Promise<void> {
  try {
    const { handleNewsletterUpsert } = await import('../src/server/newsletter-http');
    await handleNewsletterUpsert(req as never, res as never);
  } catch (error) {
    send(res, 500, { error: 'The subscription could not be stored.', detail: loadError(error) });
  }
}
