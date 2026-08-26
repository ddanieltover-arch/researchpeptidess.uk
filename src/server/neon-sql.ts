/**
 * Neon HTTP SQL client for serverless persist routes.
 * Keep this module free of Drizzle so Vercel functions can boot.
 */

import { neon } from '@neondatabase/serverless';
import { resolveDatabaseUrl } from '../lib/neon-connection-string';

type NeonSql = ReturnType<typeof neon>;

let cached: NeonSql | null | undefined;

export function getNeonSqlOrNull(): NeonSql | null {
  if (cached !== undefined) return cached;
  const resolved = resolveDatabaseUrl();
  if (!resolved) {
    cached = null;
    return null;
  }
  cached = neon(resolved.url, { fetchOptions: { cache: 'no-store' } });
  return cached;
}

export function requireNeonSql(): NeonSql {
  const sql = getNeonSqlOrNull();
  if (!sql) {
    throw new Error('DATABASE_UNAVAILABLE');
  }
  return sql;
}

export function asRowArray(result: unknown): Record<string, unknown>[] {
  return Array.isArray(result) ? (result as Record<string, unknown>[]) : [];
}

export function asIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && value.trim()) return value;
  return new Date().toISOString();
}
