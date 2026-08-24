const STORAGE_KEY = 'rpuk.recentlyViewed';
const MAX_ITEMS = 8;

export function loadRecentlyViewedIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string').slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export function recordRecentlyViewed(productId: string): string[] {
  if (typeof window === 'undefined' || !productId) return [];
  const next = [productId, ...loadRecentlyViewedIds().filter((id) => id !== productId)].slice(0, MAX_ITEMS);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clearRecentlyViewed(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
