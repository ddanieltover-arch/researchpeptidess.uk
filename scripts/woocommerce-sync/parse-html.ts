import { decodeEntities } from './sanitize-copy';
import type { WcImage, WcProduct } from './wc-types';

function extractBalancedJson(source: string, startToken: string): string | null {
  const start = source.indexOf(startToken);
  if (start < 0) return null;
  const brace = source.indexOf('{', start);
  if (brace < 0) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = brace; i < source.length; i++) {
    const char = source[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(brace, i + 1);
    }
  }
  return null;
}

interface OmnisendVariant {
  variantID: string;
  title: string;
  status: string | null;
  price: number;
  imageUrl?: string;
  customFields?: Record<string, string>;
}

interface OmnisendProduct {
  title: string;
  description?: string;
  currency?: string;
  variants?: Record<string, OmnisendVariant>;
  productID?: string;
}

interface HtmlVariation {
  variation_id: number;
  display_name?: string;
  display_price: number;
  display_regular_price?: number;
  is_in_stock?: boolean;
  is_purchasable?: boolean;
  max_qty?: number;
  attributes?: Record<string, string>;
  image?: { url?: string; full_src?: string; alt?: string };
}

function parseOmnisend(html: string): OmnisendProduct | null {
  const raw = extractBalancedJson(html, 'omnisend_product');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OmnisendProduct;
  } catch {
    return null;
  }
}

function parseVariationsAttr(html: string): HtmlVariation[] {
  const match = html.match(/data-product_variations="([^"]*)"/);
  if (!match) return [];
  try {
    const json = decodeEntities(match[1].replace(/&quot;/g, '"'));
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as HtmlVariation[]) : [];
  } catch {
    return [];
  }
}

function collectImages(html: string, omnisend: OmnisendProduct | null): WcImage[] {
  const urls: string[] = [];
  const push = (url?: string) => {
    if (!url || !url.includes('/wp-content/uploads/')) return;
    if (url.includes('logo')) return;
    const clean = url.split('?')[0];
    if (!urls.includes(clean)) urls.push(clean);
  };

  const schemaMatch = html.match(/<script type="application\/ld\+json"[^>]*>[\s\S]*?"@type":"Product"[\s\S]*?<\/script>/);
  if (schemaMatch) {
    try {
      const parsed = JSON.parse(schemaMatch[0].replace(/<script[^>]*>/, '').replace(/<\/script>/, ''));
      const graph = parsed['@graph'] || [parsed];
      const product = graph.find((node: { '@type'?: string }) => node['@type'] === 'Product');
      const images = product?.image;
      if (Array.isArray(images)) {
        for (const image of images) {
          push(typeof image === 'string' ? image : image?.url);
        }
      }
    } catch {
      /* schema optional */
    }
  }

  for (const large of html.matchAll(/data-large_image="([^"]+)"/g)) {
    push(decodeEntities(large[1]));
  }

  if (omnisend?.variants) {
    for (const variant of Object.values(omnisend.variants)) {
      push(variant.imageUrl);
    }
  }

  return urls.map((src, index) => ({
    id: index + 1,
    src,
    alt: omnisend?.title || '',
    name: omnisend?.title || '',
  }));
}

function poundsToMinor(value: number): string {
  return String(Math.round(value * 100));
}

export function htmlToWcProduct(
  wp: {
    id: number;
    slug: string;
    link: string;
    title: { rendered: string };
    content: { rendered: string };
    excerpt?: { rendered: string };
    class_list?: string[];
  },
  html: string
): { product: WcProduct; variationDetails: WcProduct[] } {
  const omnisend = parseOmnisend(html);
  const htmlVariations = parseVariationsAttr(html);
  const images = collectImages(html, omnisend);
  const classList = wp.class_list || [];
  const isVariable = classList.some((item) => item.includes('product-type-variable')) || htmlVariations.length > 0;
  const inStock = classList.some((item) => item === 'instock') || htmlVariations.some((item) => item.is_in_stock);
  const onBackorder = classList.some((item) => item.includes('onbackorder'));

  const variantEntries = Object.values(omnisend?.variants || {}).filter(
    (item) => item.variantID && item.variantID !== String(wp.id)
  );

  let minPrice = 0;
  let maxPrice = 0;
  if (htmlVariations.length) {
    const prices = htmlVariations.map((item) => item.display_price).filter((item) => item > 0);
    minPrice = Math.min(...prices);
    maxPrice = Math.max(...prices);
  } else if (variantEntries.length) {
    const prices = variantEntries.map((item) => item.price / 100);
    minPrice = Math.min(...prices);
    maxPrice = Math.max(...prices);
  } else {
    const amount = html.match(/woocommerce-Price-amount[^>]*>[\s\S]*?([\d,.]+)/);
    minPrice = amount ? Number(amount[1].replace(/,/g, '')) : 0;
    maxPrice = minPrice;
  }

  const product: WcProduct = {
    id: wp.id,
    name: decodeEntities(wp.title.rendered),
    slug: wp.slug,
    parent: 0,
    type: isVariable ? 'variable' : 'simple',
    permalink: wp.link,
    sku: '',
    short_description: wp.excerpt?.rendered || '',
    description: wp.content?.rendered || omnisend?.description || '',
    prices: {
      price: poundsToMinor(minPrice),
      regular_price: poundsToMinor(maxPrice || minPrice),
      sale_price: poundsToMinor(minPrice),
      price_range: maxPrice > minPrice ? { min_amount: poundsToMinor(minPrice), max_amount: poundsToMinor(maxPrice) } : null,
      currency_code: 'GBP',
      currency_minor_unit: 2,
    },
    images,
    categories: [],
    attributes: [],
    variations: htmlVariations.map((item) => ({
      id: item.variation_id,
      attributes: Object.entries(item.attributes || {}).map(([name, value]) => ({ name, value })),
    })),
    is_purchasable: true,
    is_in_stock: inStock || htmlVariations.some((item) => item.is_in_stock),
    is_on_backorder: onBackorder,
    stock_availability: {
      text: inStock ? 'in stock' : 'out of stock',
      class: inStock ? 'in-stock' : 'out-of-stock',
    },
  };

  const variationDetails: WcProduct[] = htmlVariations.map((item) => {
    const label =
      Object.values(item.attributes || {})[0] ||
      item.display_name?.replace(/^.*-\s*/, '') ||
      '';
    const stock = typeof item.max_qty === 'number' ? item.max_qty : item.is_in_stock ? 20 : 0;
    return {
      id: item.variation_id,
      name: item.display_name || `${product.name} ${label}`.trim(),
      slug: `${product.slug}-${label}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      parent: product.id,
      type: 'variation',
      variation: label,
      permalink: product.permalink,
      sku: '',
      short_description: '',
      description: '',
      prices: {
        price: poundsToMinor(item.display_price),
        regular_price: poundsToMinor(item.display_regular_price || item.display_price),
        sale_price: poundsToMinor(item.display_price),
        price_range: null,
        currency_code: 'GBP',
        currency_minor_unit: 2,
      },
      images: item.image?.full_src || item.image?.url
        ? [{ id: 1, src: item.image.full_src || item.image.url || '', alt: item.image.alt || product.name }]
        : [],
      is_purchasable: item.is_purchasable !== false,
      is_in_stock: Boolean(item.is_in_stock),
      is_on_backorder: false,
      add_to_cart: { text: 'Add to cart', maximum: stock, minimum: 1 },
      stock_availability: {
        text: stock > 0 ? `${stock} in stock` : 'out of stock',
        class: stock > 0 ? 'in-stock' : 'out-of-stock',
      },
    };
  });

  if (!variationDetails.length && variantEntries.length) {
    for (const [index, variant] of variantEntries.entries()) {
      const label = Object.values(variant.customFields || {})[0] || variant.title;
      variationDetails.push({
        id: Number(variant.variantID) || index + 1,
        name: variant.title,
        slug: `${product.slug}-${index + 1}`,
        parent: product.id,
        type: 'variation',
        variation: label,
        permalink: product.permalink,
        sku: '',
        short_description: '',
        description: '',
        prices: {
          price: String(variant.price),
          regular_price: String(variant.price),
          sale_price: String(variant.price),
          price_range: null,
          currency_code: 'GBP',
          currency_minor_unit: 2,
        },
        images: variant.imageUrl ? [{ id: 1, src: variant.imageUrl, alt: variant.title }] : [],
        is_purchasable: true,
        is_in_stock: variant.status !== 'outOfStock',
        is_on_backorder: false,
        add_to_cart: { text: 'Add to cart', maximum: variant.status === 'inStock' ? 25 : 0, minimum: 1 },
        stock_availability: {
          text: variant.status === 'inStock' ? 'in stock' : 'out of stock',
          class: variant.status === 'inStock' ? 'in-stock' : 'out-of-stock',
        },
      });
    }
  }

  return { product, variationDetails };
}
