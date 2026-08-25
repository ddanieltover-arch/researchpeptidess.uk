import path from 'node:path';
import fs from 'node:fs';
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import { normalizeNeonConnectionString, resolveDatabaseUrl } from '../src/lib/neon-connection-string';
import { COMMERCE_SCHEMA_STATEMENTS } from '../src/server/persist/schema-sql';

config({ path: path.join(process.cwd(), '.env') });

async function main() {
  const resolved = resolveDatabaseUrl();
  const fallback = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  const url = resolved?.url || (fallback ? normalizeNeonConnectionString(fallback) : undefined);
  if (!url) {
    console.error('DATABASE_URL: MISSING');
    process.exit(1);
  }

  const db = drizzle(neon(url, { fetchOptions: { cache: 'no-store' } }));
  await db.execute(sql`create table if not exists schema_migrations (
    filename text primary key,
    applied_at timestamp not null default now()
  )`);

  const coreTag = '0000_core_commerce.ts';
  const coreApplied = await db.execute(sql`select filename from schema_migrations where filename = ${coreTag}`);
  const coreRows =
    (coreApplied as { rows?: Array<{ filename: string }> }).rows ||
    (coreApplied as unknown as Array<{ filename: string }>);
  const coreAlready = Array.isArray(coreRows) && coreRows.some((row) => row.filename === coreTag);
  if (coreAlready) {
    console.log(`SKIP ${coreTag}`);
  } else {
    for (const statement of COMMERCE_SCHEMA_STATEMENTS) {
      try {
        await db.execute(sql.raw(statement));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!/already exists|duplicate/i.test(message)) throw error;
      }
    }
    await db.execute(sql`insert into schema_migrations (filename) values (${coreTag})`);
    console.log(`APPLIED ${coreTag}`);
  }

  const drizzleDir = path.join(process.cwd(), 'drizzle');
  const files = fs
    .readdirSync(drizzleDir)
    .filter((name) => name.endsWith('.sql'))
    .sort();

  for (const filename of files) {
    const applied = await db.execute(sql`select filename from schema_migrations where filename = ${filename}`);
    const rows = (applied as { rows?: Array<{ filename: string }> }).rows || (applied as unknown as Array<{ filename: string }>);
    const already = Array.isArray(rows) && rows.some((row) => row.filename === filename);
    if (already) {
      console.log(`SKIP ${filename}`);
      continue;
    }

    const sqlText = fs.readFileSync(path.join(drizzleDir, filename), 'utf8');
    const statements = sqlText
      .split(/;\s*(?:\r?\n|$)/)
      .map((part) => part.replace(/^\s*--[^\n]*\n/gm, '').trim())
      .filter((part) => part.length > 0);

    for (const statement of statements) {
      await db.execute(sql.raw(statement));
    }

    await db.execute(sql`insert into schema_migrations (filename) values (${filename})`);
    console.log(`APPLIED ${filename}`);
  }
}

main().catch((error) => {
  console.error('MIGRATION_FAILED', error instanceof Error ? error.name : 'Error');
  process.exit(1);
});
