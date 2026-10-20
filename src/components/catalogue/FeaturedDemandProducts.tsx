import React from 'react';
import { Product } from '../../types';
import { ProductCard } from '../ui/ProductCard';
import { AppLink } from '../ui/AppLink';

interface FeaturedDemandProductsProps {
  title: string;
  description: string;
  products: Product[];
}

export const FeaturedDemandProducts: React.FC<FeaturedDemandProductsProps> = ({
  title,
  description,
  products,
}) => {
  if (products.length === 0) return null;

  return (
    <section
      aria-labelledby="featured-demand-heading"
      className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 sm:p-8"
    >
      <div className="mb-6 max-w-2xl">
        <span className="font-mono text-xs font-bold tracking-widest text-[#4353FF] uppercase">
          Frequently requested
        </span>
        <h2 id="featured-demand-heading" className="mt-1 font-mono text-xl font-bold text-slate-900">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <p className="mt-6 text-xs text-slate-500">
        Laboratory reagents such as{' '}
        <AppLink href="/product/bacteriostatic-water-0-9-benzyl" className="text-[#4353FF] hover:underline">
          bacteriostatic water
        </AppLink>{' '}
        are listed when published — use the full catalogue for every SKU.
      </p>
    </section>
  );
};
