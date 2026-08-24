import path from 'node:path';
import fs from 'node:fs';
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';

config({ path: path.join(process.cwd(), '.env') });

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url || url.includes('sample-project')) {
    console.error('DATABASE_URL: MISSING');
    process.exit(1);
  }

  const db = drizzle(neon(url));
  await db.execute(sql`create table if not exists schema_migrations (
    filename text primary key,
    applied_at timestamp not null default now()
  )`);

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
