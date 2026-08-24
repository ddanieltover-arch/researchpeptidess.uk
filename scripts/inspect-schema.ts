/**
 * Prints table/column names only. Never prints connection strings or row data.
 */
import path from 'node:path';
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

config({ path: path.join(process.cwd(), '.env') });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url || url.includes('sample-project')) {
    console.log('DATABASE_URL: MISSING');
    process.exit(1);
  }

  const sql = neon(url);
  const tables = await sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name
  `;
  console.log('TABLES', tables.map((row) => row.table_name).join(','));

  const columns = await sql`
    select table_name, column_name, is_nullable, data_type
    from information_schema.columns
    where table_schema = 'public'
    order by table_name, ordinal_position
  `;
  for (const row of columns) {
    console.log(`${row.table_name}.${row.column_name} ${row.data_type} nullable=${row.is_nullable}`);
  }
}

main().catch((error) => {
  console.error('SCHEMA_INSPECT_FAILED', error instanceof Error ? error.name : 'Error');
  process.exit(1);
});
