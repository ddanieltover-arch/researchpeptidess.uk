/**
 * Soft fallback admin catch-all. Do not import from src/.
 */

export const config = { runtime: 'nodejs' };

type Res = {
  statusCode: number;
  setHeader: (k: string, v: string) => void;
  end: (b: string) => void;
  headersSent?: boolean;
};

export default async function handler(_req: unknown, res: Res): Promise<void> {
  if (res.headersSent) return;
  res.statusCode = 503;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({ error: 'This admin API route is temporarily unavailable.' }));
}
