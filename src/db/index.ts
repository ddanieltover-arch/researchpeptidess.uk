/**
 * Database client configuration for Neon PostgreSQL with Drizzle ORM.
 * Safe for serverless & edge environments.
 */

import * as schema from './schema';

export interface DatabaseConfig {
  connectionString?: string;
  isConfigured: boolean;
}

export function getDatabaseConfig(): DatabaseConfig {
  const connectionString = typeof process !== 'undefined' ? process.env?.DATABASE_URL : undefined;
  return {
    connectionString,
    isConfigured: Boolean(connectionString && !connectionString.includes('sample-project')),
  };
}

export { schema };
