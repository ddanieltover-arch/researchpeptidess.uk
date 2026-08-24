/**
 * Database client configuration for Neon PostgreSQL with Drizzle ORM.
 * Safe for serverless environments. Do not import this module from the Vite SPA.
 */

import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export interface DatabaseConfig {
  connectionString?: string;
  isConfigured: boolean;
}

type AppDb = ReturnType<typeof drizzle<typeof schema>>;

let cachedDb: AppDb | null = null;

export function getDatabaseConfig(): DatabaseConfig {
  const connectionString = typeof process !== 'undefined' ? process.env?.DATABASE_URL : undefined;
  return {
    connectionString,
    isConfigured: Boolean(connectionString && !connectionString.includes('sample-project')),
  };
}

export function createDb(): AppDb {
  const { connectionString, isConfigured } = getDatabaseConfig();
  if (!isConfigured || !connectionString) {
    throw new Error('DATABASE_URL is not configured');
  }
  return drizzle(neon(connectionString), { schema });
}

export function getDb(): AppDb | null {
  const { isConfigured } = getDatabaseConfig();
  if (!isConfigured) return null;
  if (!cachedDb) {
    cachedDb = createDb();
  }
  return cachedDb;
}

export async function pingDatabase(): Promise<'healthy' | 'unconfigured' | 'unavailable'> {
  const db = getDb();
  if (!db) return 'unconfigured';
  try {
    await db.execute(sql`select 1`);
    return 'healthy';
  } catch {
    return 'unavailable';
  }
}

export { schema };
