import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const ROOT = path.resolve(here, '../..');
export const PUBLIC_PRODUCTS_DIR = path.join(ROOT, 'public', 'products');
export const GENERATED_DIR = path.join(ROOT, 'src', 'lib', 'data', 'generated');
export const SCRATCH_DIR = path.join(ROOT, 'scratch');
export const REPORT_PATH = path.join(SCRATCH_DIR, 'wc-sync-report.json');
export const CATALOG_JSON_PATH = path.join(GENERATED_DIR, 'woocommerce-catalog.json');
export const FROM_WOO_TS_PATH = path.join(GENERATED_DIR, 'from-woocommerce.ts');
export const SLUG_REDIRECTS_PATH = path.join(GENERATED_DIR, 'slug-redirects.ts');
export const RAW_CACHE_PATH = path.join(SCRATCH_DIR, 'wc-raw-catalog.json');
export const VERCEL_JSON_PATH = path.join(ROOT, 'vercel.json');
export const NETLIFY_REDIRECTS_PATH = path.join(ROOT, 'public', '_redirects');
