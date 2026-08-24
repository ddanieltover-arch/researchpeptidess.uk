import fs from 'node:fs/promises';
import type { Product } from '../../src/types';
import {
  CATALOG_JSON_PATH,
  FROM_WOO_TS_PATH,
  GENERATED_DIR,
  NETLIFY_REDIRECTS_PATH,
  SLUG_REDIRECTS_PATH,
  VERCEL_JSON_PATH,
} from './paths';
import type { ExistingRecord } from './wc-types';

export interface GeneratedCatalogFile {
  generatedAt: string;
  sourceCount: number;
  matched: number;
  created: number;
  products: Product[];
  slugRedirects: Record<string, string>;
  extrasKept: Array<{ id: string; slug: string; kind: string }>;
}

export async function writeGeneratedCatalog(payload: GeneratedCatalogFile): Promise<void> {
  await fs.mkdir(GENERATED_DIR, { recursive: true });
  await fs.writeFile(CATALOG_JSON_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  const ts = `import type { Product } from '../../../types';
import catalog from './woocommerce-catalog.json';

export const WOOCOMMERCE_PRODUCTS = catalog.products as Product[];
export const SLUG_REDIRECTS = catalog.slugRedirects as Record<string, string>;
export const WC_SYNC_META = {
  generatedAt: catalog.generatedAt,
  sourceCount: catalog.sourceCount,
  matched: catalog.matched,
  created: catalog.created,
};
`;
  await fs.writeFile(FROM_WOO_TS_PATH, ts, 'utf8');

  const redirectsTs = `export const SLUG_REDIRECTS: Record<string, string> = ${JSON.stringify(payload.slugRedirects, null, 2)};
`;
  await fs.writeFile(SLUG_REDIRECTS_PATH, redirectsTs, 'utf8');
  await writeRedirectArtifacts(payload.slugRedirects);
}

export async function writeRedirectArtifacts(slugRedirects: Record<string, string>): Promise<void> {
  const vercelRaw = await fs.readFile(VERCEL_JSON_PATH, 'utf8');
  const vercel = JSON.parse(vercelRaw) as {
    rewrites?: unknown;
    redirects?: Array<{ source: string; destination: string; permanent: boolean }>;
  };
  vercel.redirects = Object.entries(slugRedirects).map(([from, to]) => ({
    source: `/product/${from}`,
    destination: `/product/${to}`,
    permanent: true,
  }));
  await fs.writeFile(VERCEL_JSON_PATH, `${JSON.stringify(vercel, null, 2)}\n`, 'utf8');

  const lines = [
    ...Object.entries(slugRedirects).map(([from, to]) => `/product/${from} /product/${to} 301`),
    '/*    /index.html   200',
    '',
  ];
  await fs.writeFile(NETLIFY_REDIRECTS_PATH, lines.join('\n'), 'utf8');
}

export function buildSlugRedirects(products: Product[], matched: ExistingRecord[]): Record<string, string> {
  const redirects: Record<string, string> = {};
  for (const rec of matched) {
    const next = products.find((item) => item.id === rec.id);
    if (next && rec.slug && next.slug && rec.slug !== next.slug) {
      redirects[rec.slug] = next.slug;
    }
  }
  return redirects;
}
