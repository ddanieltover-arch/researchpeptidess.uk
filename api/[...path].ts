/**
 * Catch-all kept as a soft fallback. Critical routes have dedicated functions.
 * Do not import from src/ — that crashes this serverless function at boot.
 */

export const config = { runtime: 'nodejs' };

type Res = {
  statusCode: number;
  setHeader: (k: string, v: string) => void;
  end: (b: string) => void;
  headersSent?: boolean;
};

type Req = {
  method?: string;
  url?: string;
};

export default async function handler(req: Req, res: Res): Promise<void> {
  if (res.headersSent) return;
  const path = String(req.url || '').split('?')[0];
  res.statusCode = 503;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(
    JSON.stringify({
      error: 'This API route is temporarily unavailable.',
      path,
      hint: 'Use dedicated /api/orders, /api/admin/login, /api/health, or /api/ready endpoints.',
    })
  );
}
