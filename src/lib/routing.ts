/**
 * Unique-slug URL map for the Research Peptides UK storefront.
 *
 * Paths are real History API routes (not hash fragments), so each page can be
 * opened, shared, crawled, and bookmarked independently.
 */

import { SLUG_REDIRECTS } from './data/generated/slug-redirects';
import {
  CATEGORY_SLUG_TO_PUBLIC_PATH,
  FIRST_CLASS_CATALOGUE_PATHS,
  isFirstClassCataloguePath,
  publicPathForCategorySlug,
  resolveFirstClassCategorySlug,
} from './catalogue-collections';

export interface NavigateOptions {
  replace?: boolean;
  scroll?: boolean;
}

export type RouteKind =
  | 'home'
  | 'shop'
  | 'category'
  | 'product'
  | 'search'
  | 'cart'
  | 'checkout'
  | 'account'
  | 'admin'
  | 'admin-login'
  | 'cms'
  | 'notfound';

export interface ParsedAppRoute {
  kind: RouteKind;
  pathname: string;
  search: string;
  href: string;
  slug?: string;
  query: Record<string, string>;
}

/** First path segment values that must never be treated as CMS slugs. */
export const RESERVED_SLUGS = new Set([
  'shop',
  'product',
  'category',
  'search',
  'cart',
  'checkout',
  'account',
  'admin',
  'api',
  'assets',
  'payment-verification',
  'peptides',
  'research-chemicals',
]);

export const ROUTES = {
  home: '/',
  shop: '/shop',
  search: '/search',
  peptides: '/peptides',
  researchChemicals: '/research-chemicals',
  cart: '/cart',
  checkout: '/checkout',
  account: '/account',
  admin: '/admin',
  adminLogin: '/admin/login',
} as const;

export function productPath(slug: string): string {
  return `/product/${SLUG_REDIRECTS[slug] || slug}`;
}

export function resolveProductSlug(slug: string): string {
  return SLUG_REDIRECTS[slug] || slug;
}

export function categoryPath(slug: string, searchQuery?: string): string {
  const base = publicPathForCategorySlug(slug);
  const q = searchQuery?.trim();
  return q ? `${base}?q=${encodeURIComponent(q)}` : base;
}

export function searchPath(query: string): string {
  const q = query.trim();
  return q ? `/search?q=${encodeURIComponent(q)}` : ROUTES.shop;
}

export function shopPath(searchQuery?: string): string {
  return searchQuery?.trim() ? searchPath(searchQuery) : ROUTES.shop;
}

export function cmsPath(slug: string): string {
  return `/${slug}`;
}

function parseQuery(search: string): Record<string, string> {
  const query: Record<string, string> = {};
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  params.forEach((value, key) => {
    if (!(key in query)) {
      query[key] = value;
    }
  });
  return query;
}

/**
 * Parses a path + optional query into a typed storefront route.
 */
export function parseAppPath(input: string): ParsedAppRoute {
  const raw = (input || '/').trim();
  const hashIndex = raw.indexOf('#');
  const withoutHash = hashIndex >= 0 ? raw.slice(0, hashIndex) : raw;

  let pathname = withoutHash;
  let search = '';
  const qIndex = withoutHash.indexOf('?');
  if (qIndex >= 0) {
    pathname = withoutHash.slice(0, qIndex);
    search = withoutHash.slice(qIndex + 1);
  }

  pathname = pathname.replace(/\/+$/, '') || '/';
  if (!pathname.startsWith('/')) {
    pathname = `/${pathname}`;
  }

  const query = parseQuery(search);
  const href = search ? `${pathname}?${search}` : pathname;
  const segments = pathname.split('/').filter(Boolean);

  const base = (kind: RouteKind, extra: Partial<ParsedAppRoute> = {}): ParsedAppRoute => ({
    kind,
    pathname,
    search,
    href,
    query,
    ...extra,
  });

  if (pathname === '/') {
    return base('home');
  }

  if (segments[0] === 'shop' && segments.length === 1) {
    return base('shop', { pathname: ROUTES.shop, href: search ? `${ROUTES.shop}?${search}` : ROUTES.shop });
  }

  if (segments[0] === 'search' && segments.length === 1) {
    return base('search', { pathname: ROUTES.search, href: search ? `${ROUTES.search}?${search}` : ROUTES.search });
  }

  if (segments.length === 1 && isFirstClassCataloguePath(segments[0])) {
    const categorySlug = resolveFirstClassCategorySlug(segments[0]) || segments[0];
    const pathname = `/${segments[0]}`;
    return base('category', {
      pathname,
      slug: categorySlug,
      href: search ? `${pathname}?${search}` : pathname,
    });
  }

  if (segments[0] === 'category' && segments.length === 2) {
    return base('category', {
      pathname: `/category/${segments[1]}`,
      slug: FIRST_CLASS_CATALOGUE_PATHS[segments[1]] || segments[1],
      href: search ? `/category/${segments[1]}?${search}` : `/category/${segments[1]}`,
    });
  }

  if (segments[0] === 'product' && segments.length === 2) {
    return base('product', {
      pathname: `/product/${segments[1]}`,
      slug: segments[1],
      href: `/product/${segments[1]}`,
    });
  }

  if (segments.length === 1) {
    const leaf = segments[0];
    if (leaf === 'cart') return base('cart', { pathname: ROUTES.cart, href: ROUTES.cart });
    if (leaf === 'checkout') return base('checkout', { pathname: ROUTES.checkout, href: ROUTES.checkout });
    if (leaf === 'account') return base('account', { pathname: ROUTES.account, href: ROUTES.account });
    if (leaf === 'admin') return base('admin', { pathname: ROUTES.admin, href: ROUTES.admin });
    if (!RESERVED_SLUGS.has(leaf)) {
      return base('cms', { slug: leaf, pathname: `/${leaf}`, href: `/${leaf}` });
    }
  }

  if (segments[0] === 'admin' && segments[1] === 'login' && segments.length === 2) {
    return base('admin-login', { pathname: ROUTES.adminLogin, href: ROUTES.adminLogin });
  }

  return base('notfound');
}

/**
 * Legacy `/shop?category=` URLs collapse onto unique `/category/:slug` paths.
 */
export function canonicalizeLocation(input: string): { href: string; didCanonicalize: boolean } {
  const parsed = parseAppPath(input);
  if (parsed.kind === 'shop' && parsed.query.category) {
    return { href: categoryPath(parsed.query.category, parsed.query.q), didCanonicalize: true };
  }
  if (parsed.kind === 'category' && parsed.slug) {
    const preferred = categoryPath(parsed.slug, parsed.query.q);
    if (preferred !== parsed.href) {
      return { href: preferred, didCanonicalize: true };
    }
  }
  if (parsed.kind === 'product' && parsed.slug && SLUG_REDIRECTS[parsed.slug]) {
    return { href: `/product/${SLUG_REDIRECTS[parsed.slug]}`, didCanonicalize: true };
  }
  return { href: parsed.href, didCanonicalize: parsed.href !== input };
}

/** Reads the current browser location, including legacy hash routes. */
export function readBrowserLocation(): string {
  if (typeof window === 'undefined') return '/';

  const hash = window.location.hash;
  const pathIsRoot = window.location.pathname === '/' || window.location.pathname === '';

  if (hash.startsWith('#/')) {
    return hash.slice(1) || '/';
  }

  if (pathIsRoot && hash.startsWith('#') && hash.length > 1) {
    const inner = hash.slice(1);
    return inner.startsWith('/') ? inner : `/${inner}`;
  }

  return `${window.location.pathname}${window.location.search}` || '/';
}

export function getBrowserHref(): string {
  if (typeof window === 'undefined') return '/';
  return `${window.location.pathname}${window.location.search}` || '/';
}

export function isCatalogueRoute(kind: RouteKind): boolean {
  return kind === 'shop' || kind === 'category' || kind === 'search';
}

export function isNavActive(currentHref: string, navHref: string): boolean {
  const current = parseAppPath(currentHref);
  const nav = parseAppPath(navHref);

  if (nav.kind === 'shop') {
    if (current.kind === 'shop' || current.kind === 'search') return true;
    if (current.kind === 'category' && current.slug && !CATEGORY_SLUG_TO_PUBLIC_PATH[current.slug]) {
      return true;
    }
    return false;
  }

  if (nav.kind === 'category') {
    return current.kind === 'category' && current.slug === nav.slug;
  }

  if (nav.kind === 'home') {
    return current.kind === 'home';
  }

  return current.pathname === nav.pathname;
}
