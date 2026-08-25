/**
 * Local persistence diagnostic. Prints table names and sanitized error classes only.
 * Never logs connection strings, tokens, or customer data.
 */
import path from 'node:path';
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';

config({ path: path.join(process.cwd(), '.env') });

const SECRETISH = /postgres(?:ql)?:\/\/\S+|password=[^&\s]+|npg_[A-Za-z0-9]+|ep-[a-z0-9-]+/gi;

function sanitize(input: string): string {
  return input.replace(SECRETISH, '[redacted]').slice(0, 240);
}

function normalize(raw: string): string {
  try {
    const url = new URL(raw);
    url.searchParams.delete('channel_binding');
    if (!url.searchParams.get('sslmode')) url.searchParams.set('sslmode', 'require');
    return url.toString();
  } catch {
    return raw.replace(/[?&]channel_binding=[^&]*/g, '');
  }
}

function firstUrl(): { name: string; raw?: string } {
  const keys = [
    'DATABASE_URL',
    'POSTGRES_URL',
    'POSTGRES_PRISMA_URL',
    'DATABASE_URL_UNPOOLED',
    'POSTGRES_URL_NON_POOLING',
  ];
  for (const name of keys) {
    const value = process.env[name];
    if (value && !value.includes('sample-project') && !value.includes('user:password@')) {
      return { name, raw: value };
    }
  }
  return { name: 'NONE' };
}

async function ping(label: string, connectionString: string): Promise<void> {
  try {
    const db = drizzle(neon(connectionString));
    await db.execute(sql`select 1 as ok`);
    console.log(`PING ${label}: OK`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`PING ${label}: FAIL ${error instanceof Error ? error.name : 'Error'} ${sanitize(message)}`);
  }
}

async function main() {
  const selected = firstUrl();
  console.log(`SOURCE ${selected.name}`);
  if (!selected.raw) {
    console.log('DATABASE: MISSING');
    process.exit(1);
  }

  const asIs = selected.raw;
  const normalized = normalize(asIs);
  const hasChannelBinding = /channel_binding=/i.test(asIs);
  console.log(`CHANNEL_BINDING ${hasChannelBinding ? 'PRESENT' : 'ABSENT'}`);
  console.log(`NORMALIZED_CHANGED ${normalized !== asIs ? 'YES' : 'NO'}`);

  await ping('as-is', asIs);
  await ping('normalized', normalized);

  try {
    const db = drizzle(neon(normalized));
    const result = await db.execute(sql`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
      order by table_name
    `);
    const rows = (result as { rows?: Array<{ table_name: string }> }).rows
      || (result as unknown as Array<{ table_name: string }>);
    const names = Array.isArray(rows) ? rows.map((row) => ('table_name' in row ? row.table_name : Object.values(row)[0])) : [];
    console.log(`TABLE_COUNT ${names.length}`);
    console.log(`TABLES ${names.join(',')}`);

    const expected = [
      'users',
      'orders',
      'order_items',
      'order_payments',
      'inventory_events',
      'shipping_methods',
      'store_settings',
      'product_merchandising',
      'contact_messages',
      'newsletter_subscriptions',
      'product_variants',
    ];
    const missing = expected.filter((name) => !names.includes(name));
    console.log(`MISSING ${missing.length ? missing.join(',') : 'none'}`);

    const cols = await db.execute(sql`
      select column_name
      from information_schema.columns
      where table_schema = 'public' and table_name = 'orders'
      order by ordinal_position
    `);
    const colRows = (cols as { rows?: Array<{ column_name: string }> }).rows
      || (cols as unknown as Array<{ column_name: string }>);
    const colNames = Array.isArray(colRows)
      ? colRows.map((row) => ('column_name' in row ? row.column_name : Object.values(row)[0]))
      : [];
    console.log(`ORDERS_COLUMNS ${colNames.length ? colNames.join(',') : 'none'}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`SCHEMA_INSPECT FAIL ${error instanceof Error ? error.name : 'Error'} ${sanitize(message)}`);
  }

  try {
    await import('../src/server/api-router');
    console.log('IMPORT api-router: OK');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`IMPORT api-router: FAIL ${error instanceof Error ? error.name : 'Error'} ${sanitize(message)}`);
  }

  try {
    await import('../src/server/persist/commerce');
    console.log('IMPORT persist/commerce: OK');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`IMPORT persist/commerce: FAIL ${error instanceof Error ? error.name : 'Error'} ${sanitize(message)}`);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('DIAGNOSTIC_FAILED', sanitize(message));
  process.exit(1);
});
