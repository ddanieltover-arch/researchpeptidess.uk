/**
 * Normalize Neon/Postgres URLs for the serverless HTTP driver.
 * Strips libpq-only options that can stall @neondatabase/serverless.
 */

const PLACEHOLDER_MARKERS = ['sample-project', 'user:password@'];

export function isUsableDatabaseUrl(value: string | undefined): boolean {
  if (!value || !value.trim()) return false;
  return !PLACEHOLDER_MARKERS.some((marker) => value.includes(marker));
}

export function normalizeNeonConnectionString(raw: string): string {
  const trimmed = raw.trim();
  try {
    const url = new URL(trimmed);
    url.searchParams.delete('channel_binding');
    if (!url.searchParams.get('sslmode')) {
      url.searchParams.set('sslmode', 'require');
    }
    return url.toString();
  } catch {
    return trimmed.replace(/([?&])channel_binding=[^&]*/gi, '$1').replace(/[?&]$/, '');
  }
}

export function resolveDatabaseUrl(
  env: Record<string, string | undefined> = typeof process !== 'undefined' ? process.env : {}
): { name: string; url: string } | null {
  const candidates: Array<[string, string | undefined]> = [
    ['DATABASE_URL', env.DATABASE_URL],
    ['POSTGRES_URL', env.POSTGRES_URL],
    ['POSTGRES_PRISMA_URL', env.POSTGRES_PRISMA_URL],
    ['DATABASE_URL_UNPOOLED', env.DATABASE_URL_UNPOOLED],
    ['POSTGRES_URL_NON_POOLING', env.POSTGRES_URL_NON_POOLING],
  ];
  for (const [name, value] of candidates) {
    if (isUsableDatabaseUrl(value)) {
      return { name, url: normalizeNeonConnectionString(value!) };
    }
  }
  return null;
}
