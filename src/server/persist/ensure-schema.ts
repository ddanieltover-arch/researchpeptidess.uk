import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import { resolveDatabaseUrl } from '../../lib/neon-connection-string';
import { PersistStageError } from '../../lib/persist-error';
import { COMMERCE_SCHEMA_STATEMENTS } from './schema-sql';

let ensured: Promise<void> | null = null;

export async function ensureCommerceSchema(): Promise<void> {
  if (!ensured) {
    ensured = runEnsure().catch((error) => {
      ensured = null;
      throw error;
    });
  }
  await ensured;
}

async function commerceTablesReady(db: ReturnType<typeof drizzle>): Promise<boolean> {
  try {
    await db.execute(sql`select id from orders limit 1`);
    await db.execute(sql`select id from contact_messages limit 1`);
    await db.execute(sql`select id from newsletter_subscriptions limit 1`);
    await db.execute(sql`select id from order_payments limit 1`);
    return true;
  } catch {
    return false;
  }
}

async function runEnsure(): Promise<void> {
  const resolved = resolveDatabaseUrl();
  if (!resolved) {
    throw new PersistStageError('database_connection', 'DATABASE_UNAVAILABLE', 'DATABASE_UNAVAILABLE');
  }
  const db = drizzle(neon(resolved.url, { fetchOptions: { cache: 'no-store' } }));
  if (await commerceTablesReady(db)) {
    return;
  }
  for (const statement of COMMERCE_SCHEMA_STATEMENTS) {
    try {
      await db.execute(sql.raw(statement));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/already exists|duplicate_object|42710|42P07/i.test(message)) continue;
      throw new PersistStageError(
        'schema_ensure',
        /fetch failed|timeout|channel_binding|ECONN|ENOTFOUND/i.test(message) ? 'CONNECTION' : 'SCHEMA_MISSING',
        'Commerce schema could not be ensured.'
      );
    }
  }
}
