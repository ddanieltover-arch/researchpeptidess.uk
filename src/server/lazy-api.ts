import type { IncomingMessage, ServerResponse } from 'node:http';

export const vercelNodeConfig = { runtime: 'nodejs' as const };

export function sendApiJson(
  res: ServerResponse,
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

export async function runLazyApi(
  req: IncomingMessage,
  res: ServerResponse,
  load: () => Promise<(request: IncomingMessage, response: ServerResponse) => Promise<void | boolean>>,
  fallbackMessage: string
): Promise<void> {
  try {
    const handle = await load();
    await handle(req, res);
  } catch {
    sendApiJson(res, 500, { error: fallbackMessage });
  }
}
