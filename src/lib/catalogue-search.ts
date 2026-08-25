import { Product, ProductCategory } from '../types';

export interface CatalogueSearchHit {
  product: Product;
  score: number;
  directMatch: boolean;
}

function normalize(value: string): string {
  return String(value || '').trim().toLowerCase();
}

export function productMatchesQuery(product: Product, query: string, categoryName?: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  const variants = product.variants || [];
  const haystacks = [
    product.name,
    product.slug,
    product.sku,
    product.casNumber,
    product.shortDescription,
    product.categoryName,
    categoryName,
    ...variants.map((variant) => variant.sku),
    ...variants.map((variant) => variant.casNumber || ''),
    ...variants.map((variant) => variant.size),
  ];
  return haystacks.some((value) => value && normalize(value).includes(q));
}

export function searchCatalogueProducts(
  products: Product[],
  query: string,
  categories: ProductCategory[] = [],
  limit = 8
): CatalogueSearchHit[] {
  const q = normalize(query);
  if (!q) return [];

  const list = Array.isArray(products) ? products : [];
  const categoryById = new Map((categories || []).map((category) => [category.id, category.name]));

  return list
    .map((product) => {
      const categoryName = categoryById.get(product.categoryId) || product.categoryName || '';
      if (!productMatchesQuery(product, q, categoryName)) {
        return null;
      }
      const name = normalize(product.name);
      const sku = normalize(product.sku);
      const slug = normalize(product.slug);
      const cas = normalize(product.casNumber || '');
      const variants = product.variants || [];
      const variantSkuMatch = variants.some((variant) => normalize(variant.sku) === q);
      const directMatch =
        name === q || sku === q || slug === q || cas === q || variantSkuMatch || name.startsWith(q);
      let score = 10;
      if (directMatch) score += 50;
      if (name.includes(q)) score += 20;
      if (sku.includes(q) || variants.some((variant) => normalize(variant.sku).includes(q))) score += 15;
      if (cas.includes(q)) score += 12;
      if (normalize(categoryName).includes(q)) score += 8;
      return { product, score, directMatch };
    })
    .filter((hit): hit is CatalogueSearchHit => Boolean(hit))
    .sort((a, b) => b.score - a.score || (a.product.name || '').localeCompare(b.product.name || ''))
    .slice(0, limit);
}

const RECENT_SEARCHES_KEY = 'rpuk.recentSearches';
const MAX_RECENT_SEARCHES = 6;

export function loadRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string').slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
}

export function rememberSearchQuery(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed || typeof window === 'undefined') return loadRecentSearches();
  const next = [trimmed, ...loadRecentSearches().filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(
    0,
    MAX_RECENT_SEARCHES
  );
  window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  return next;
}

export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(RECENT_SEARCHES_KEY);
}
