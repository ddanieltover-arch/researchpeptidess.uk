import React from 'react';
import { Product } from '../../types';
import { ProductCard } from '../ui/ProductCard';
import { AppLink } from '../ui/AppLink';

export interface HomeProductRailProps {
  eyebrow?: string;
  title: string;
  description?: string;
  products: Product[];
  href?: string;
  linkLabel?: string;
  tone?: 'default' | 'panel';
}

export const HomeProductRail: React.FC<HomeProductRailProps> = ({
  eyebrow,
  title,
  description,
  products,
  href,
  linkLabel = 'View all →',
  tone = 'default',
}) => {
  if (products.length === 0) return null;

  const shell =
    tone === 'panel'
      ? 'rounded-2xl border border-slate-200 bg-white px-4 py-8 sm:px-8 sm:py-10'
      : '';

  return (
    <section className={`mx-auto max-w-7xl px-4 sm:px-8 lg:px-10 ${shell}`}>
      <div className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          {eyebrow && (
            <span className="mb-1 block font-mono text-xs font-bold tracking-widest text-[#4353FF] uppercase">
              {eyebrow}
            </span>
          )}
          <h2 className="font-mono text-xl font-bold text-slate-900 sm:text-2xl">{title}</h2>
          {description && <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>}
        </div>
        {href && (
          <AppLink href={href} className="shrink-0 font-mono text-xs font-bold tracking-wider text-[#4353FF] uppercase">
            {linkLabel}
          </AppLink>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};
