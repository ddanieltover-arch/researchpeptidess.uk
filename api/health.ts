export const config = { runtime: 'nodejs' };

function send(res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b: string) => void }, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function envPresent(name: string): boolean {
  const value = typeof process !== 'undefined' ? process.env[name] : undefined;
  if (!value || !value.trim()) return false;
  return !/sample|your-|xxxxxxxx/i.test(value);
}

export default async function handler(
  req: { method?: string },
  res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b: string) => void }
): Promise<void> {
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, { error: 'Method not allowed.' });
    return;
  }

  const database = envPresent('DATABASE_URL') || envPresent('POSTGRES_URL') || envPresent('POSTGRES_PRISMA_URL') ? 'configured' : 'unconfigured';
  const storage = envPresent('STORAGE_ENDPOINT') ? 'configured' : 'unconfigured';
  send(res, 200, {
    status: database === 'configured' ? 'healthy' : 'degraded',
    database,
    storage,
  });
}
