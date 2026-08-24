import React, { useMemo, useState } from 'react';
import { Product } from '../../types';
import { clearRecentlyViewed, loadRecentlyViewedIds } from '../../lib/recently-viewed';
import { ProductCard } from '../ui/ProductCard';

interface RecentlyViewedRailProps {
  products: Product[];
  excludeProductId?: string;
  title?: string;
}

export const RecentlyViewedRail: React.FC<RecentlyViewedRailProps> = ({
  products,
  excludeProductId,
  title = 'Recently viewed',
}) => {
  const [ids, setIds] = useState<string[]>(() => loadRecentlyViewedIds());

  const items = useMemo(() => {
    const byId = new Map(products.map((product) => [product.id, product]));
    return ids
      .filter((id) => id !== excludeProductId)
      .map((id) => byId.get(id))
      .filter((product): product is Product => Boolean(product))
      .slice(0, 4);
  }, [ids, products, excludeProductId]);

  if (items.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <h2 className="font-mono text-lg font-bold text-slate-900">{title}</h2>
        <button
          type="button"
          className="font-mono text-[11px] uppercase tracking-wider text-slate-500 hover:text-slate-800"
          onClick={() => {
            clearRecentlyViewed();
            setIds([]);
          }}
        >
          Clear list
        </button>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};
