import path from 'node:path';
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

config({ path: path.join(process.cwd(), '.env') });

async function main() {
  const sql = neon(process.env.DATABASE_URL as string);
  const tables = await sql`
    select table_name from information_schema.tables
    where table_schema = 'public'
      and table_name in (
        'product_merchandising',
        'merchandising_audit',
        'newsletter_subscriptions',
        'contact_messages',
        'store_settings',
        'order_payments',
        'inventory_events'
      )
    order by table_name
  `;
  console.log(tables.map((row) => row.table_name).join(','));
  const cols = await sql`
    select column_name from information_schema.columns
    where table_name = 'orders' and column_name in ('payload_json','app_status','payment_status','idempotency_key')
    order by column_name
  `;
  console.log(cols.map((row) => row.column_name).join(','));
}

main().catch((error) => {
  console.error('VERIFY_FAILED', error instanceof Error ? error.name : 'Error');
  process.exit(1);
});
