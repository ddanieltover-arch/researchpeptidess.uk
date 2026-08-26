import type { IncomingMessage, ServerResponse } from 'node:http';

function send(
  res: ServerResponse,
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

export async function dispatchVercelApi(
  req: IncomingMessage,
  res: ServerResponse,
  fallbackMessage: string
): Promise<void> {
  try {
    const { handleApiRequest } = await import('./api-router');
    const handled = await handleApiRequest(req, res);
    if (!handled && !res.headersSent) {
      send(res, 404, { error: 'Not found.' });
    }
  } catch (error) {
    send(res, 500, { error: fallbackMessage, detail: loadError(error) });
  }
}
