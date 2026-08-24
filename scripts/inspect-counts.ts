import path from 'node:path';
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

config({ path: path.join(process.cwd(), '.env') });

async function main() {
  const sql = neon(process.env.DATABASE_URL as string);
  const [{ products }] = await sql`select count(*)::int as products from products`;
  const [{ published }] = await sql`select count(*)::int as published from products where status = 'PUBLISHED'`;
  const [{ variants }] = await sql`select count(*)::int as variants from product_variants`;
  const [{ shipping }] = await sql`select count(*)::int as shipping from shipping_methods`;
  const [{ orders }] = await sql`select count(*)::int as orders from orders`;
  console.log(`products=${products} published=${published} variants=${variants} shipping=${shipping} orders=${orders}`);
}

main().catch((error) => {
  console.error('COUNT_FAILED', error instanceof Error ? error.name : 'Error');
  process.exit(1);
});
