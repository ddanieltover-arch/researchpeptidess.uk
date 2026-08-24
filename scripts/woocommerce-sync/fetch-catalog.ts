import fs from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { htmlToWcProduct } from './parse-html';
import { RAW_CACHE_PATH, SCRATCH_DIR } from './paths';
import type { WcProduct } from './wc-types';

const execFileAsync = promisify(execFile);
const WP_PRODUCTS = 'https://researchpeptide.co.uk/wp-json/wp/v2/product';
const USER_AGENT = 'Mozilla/5.0';
const CURL = process.platform === 'win32' ? 'curl.exe' : 'curl';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function curlGet(url: string): Promise<string> {
  const { stdout, stderr } = await execFileAsync(
    CURL,
    ['-sS', '-A', USER_AGENT, url],
    { maxBuffer: 32 * 1024 * 1024, timeout: 60000 }
  );
  if (stderr && /curl:/.test(stderr)) {
    throw new Error(stderr);
  }
  return stdout;
}

async function fetchJson<T>(url: string): Promise<T> {
  const text = await curlGet(url);
  const trimmed = text.trim();
  if (trimmed.startsWith('<')) {
    throw new Error(`Blocked fetching ${url}: ${trimmed.slice(0, 120)}`);
  }
  return JSON.parse(text) as T;
}

interface WpProduct {
  id: number;
  slug: string;
  link: string;
  status: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  class_list?: string[];
}

export async function fetchCatalogWithVariations(
  onProgress?: (done: number, total: number, label: string) => void,
  fromCache = false
): Promise<{ products: WcProduct[]; variations: Map<number, WcProduct[]> }> {
  if (fromCache) {
    const cached = JSON.parse(await fs.readFile(RAW_CACHE_PATH, 'utf8')) as {
      products: WcProduct[];
      variations: Record<string, WcProduct[]>;
    };
    return {
      products: cached.products,
      variations: new Map(Object.entries(cached.variations).map(([key, value]) => [Number(key), value])),
    };
  }

  const list = await fetchJson<WpProduct[]>(`${WP_PRODUCTS}?per_page=100`);
  const published = list.filter((item) => item.status === 'publish');
  const products: WcProduct[] = [];
  const variations = new Map<number, WcProduct[]>();

  for (let i = 0; i < published.length; i++) {
    const wp = published[i];
    onProgress?.(i + 1, published.length, wp.slug);
    const html = await curlGet(wp.link);
    const mapped = htmlToWcProduct(wp, html);
    products.push(mapped.product);
    variations.set(mapped.product.id, mapped.variationDetails);
    await sleep(120);
  }

  await fs.mkdir(SCRATCH_DIR, { recursive: true });
  await fs.writeFile(
    RAW_CACHE_PATH,
    `${JSON.stringify({
      products,
      variations: Object.fromEntries(variations),
    })}\n`,
    'utf8'
  );

  return { products, variations };
}
