import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Product, ProductCategory } from '../../types';
import { AppLink } from '../ui/AppLink';
import { productPath, searchPath } from '../../lib/routing';
import {
  clearRecentSearches,
  loadRecentSearches,
  rememberSearchQuery,
  searchCatalogueProducts,
} from '../../lib/catalogue-search';
import { formatProductPriceFrom } from '../../lib/product-display';
import { formatProductDisplayName } from '../../lib/product-display';

interface CatalogueSearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onNavigate: (href: string) => void;
  products: Product[];
  categories: ProductCategory[];
  currency?: 'GBP' | 'EUR';
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  id?: string;
}

export const CatalogueSearchBox: React.FC<CatalogueSearchBoxProps> = ({
  value,
  onChange,
  onNavigate,
  products,
  categories,
  currency = 'GBP',
  placeholder = 'Search name, SKU or CAS…',
  className = '',
  inputClassName = '',
  autoFocus,
  id,
}) => {
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecent(loadRecentSearches());
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const hits = useMemo(
    () => searchCatalogueProducts(products, value, categories, 6),
    [products, value, categories]
  );
  const directHit = hits.find((hit) => hit.directMatch);

  const submitQuery = (query: string) => {
    const trimmed = query.trim();
    if (trimmed) {
      setRecent(rememberSearchQuery(trimmed));
    }
    setOpen(false);
    onNavigate(searchPath(trimmed));
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (directHit) {
            setRecent(rememberSearchQuery(value));
            setOpen(false);
            onNavigate(productPath(directHit.product.slug));
            return;
          }
          submitQuery(value);
        }}
      >
        <input
          id={id}
          type="search"
          value={value}
          autoFocus={autoFocus}
          placeholder={placeholder}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className={inputClassName}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
        />
      </form>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          {value.trim() && hits.length > 0 && (
            <ul className="max-h-80 overflow-y-auto py-1">
              {hits.map((hit) => (
                <li key={hit.product.id}>
                  <AppLink
                    href={productPath(hit.product.slug)}
                    onClick={() => {
                      setRecent(rememberSearchQuery(value));
                      setOpen(false);
                    }}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-blue-50"
                  >
                    <span>
                      <span className="block text-xs font-semibold text-slate-900">
                        {formatProductDisplayName(hit.product.name)}
                      </span>
                      <span className="block font-mono text-[10px] text-slate-500">
                        {hit.product.sku}
                        {hit.directMatch ? ' · Direct match' : ''}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-slate-700">
                      {formatProductPriceFrom(hit.product, currency as 'GBP' | 'EUR')}
                    </span>
                  </AppLink>
                </li>
              ))}
            </ul>
          )}

          {value.trim() && hits.length === 0 && (
            <div className="space-y-2 px-3 py-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-900">No compounds match “{value.trim()}”.</p>
              <p>Try a SKU, CAS number, or browse the catalogue.</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <AppLink href="/peptides" onClick={() => setOpen(false)} className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] uppercase">
                  Peptides
                </AppLink>
                <AppLink href="/shop" onClick={() => setOpen(false)} className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] uppercase">
                  Full catalogue
                </AppLink>
                <AppLink href="/quality" onClick={() => setOpen(false)} className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] uppercase">
                  Documentation
                </AppLink>
              </div>
            </div>
          )}

          {!value.trim() && recent.length > 0 && (
            <div className="px-3 py-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Recent searches
                </span>
                <button
                  type="button"
                  className="font-mono text-[10px] text-slate-500 hover:text-slate-800"
                  onClick={() => {
                    clearRecentSearches();
                    setRecent([]);
                  }}
                >
                  Clear
                </button>
              </div>
              <ul className="space-y-1">
                {recent.map((item) => (
                  <li key={item}>
                    <button
                      type="button"
                      className="w-full rounded-md px-2 py-1 text-left text-xs text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        onChange(item);
                        submitQuery(item);
                      }}
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
