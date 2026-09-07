/**
 * Neon SQL helper for Vercel api/_lib handlers.
 * Keep this inside api/ so Vercel compiles it with the function.
 */

type NeonSql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>;

let cached: NeonSql | null | undefined;

function resolveDatabaseUrl(): string | null {
  for (const key of [
    'DATABASE_URL',
    'POSTGRES_URL',
    'POSTGRES_PRISMA_URL',
    'DATABASE_URL_UNPOOLED',
    'POSTGRES_URL_NON_POOLING',
  ]) {
    const value = (process.env[key] || '').trim();
    if (!value || value.includes('sample-project') || value.includes('user:password@')) continue;
    try {
      const url = new URL(value);
      url.searchParams.delete('channel_binding');
      if (!url.searchParams.get('sslmode')) url.searchParams.set('sslmode', 'require');
      return url.toString();
    } catch {
      return value;
    }
  }
  return null;
}

export async function getSql(): Promise<NeonSql | null> {
  if (cached !== undefined) return cached;
  const connectionString = resolveDatabaseUrl();
  if (!connectionString) {
    cached = null;
    return null;
  }
  const { neon } = await import('@neondatabase/serverless');
  cached = neon(connectionString, { fetchOptions: { cache: 'no-store' } }) as unknown as NeonSql;
  return cached;
}

export async function requireSql(): Promise<NeonSql> {
  const sql = await getSql();
  if (!sql) throw new Error('DATABASE_UNAVAILABLE');
  return sql;
}

export function asRowArray(result: unknown): Record<string, unknown>[] {
  return Array.isArray(result) ? (result as Record<string, unknown>[]) : [];
}
