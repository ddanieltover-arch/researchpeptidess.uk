import React from 'react';
import { Check, Plus, Shield, Star } from 'lucide-react';
import { Product } from '../../types';
import { AppLink } from '../ui/AppLink';
import { productPath } from '../../lib/routing';
import {
  documentedPurityLabel,
  formatProductDisplayName,
  formatProductPriceFrom,
  getPurchasableVariants,
  getStockPresentation,
} from '../../lib/product-display';

interface HeroFeaturedProductProps {
  product: Product;
  isBestseller?: boolean;
}

export const HeroFeaturedProduct: React.FC<HeroFeaturedProductProps> = ({ product, isBestseller = false }) => {
  const variants = getPurchasableVariants(product);
  const leadVariant =
    [...variants].sort((a, b) => (a.quantityValue || 0) - (b.quantityValue || 0))[0] || product.variants[0];
  const primaryImage = product.images.find((image) => image.isPrimary)?.url || product.images[0]?.url;
  const displayName = formatProductDisplayName(product.name);
  const title = leadVariant?.size ? `${displayName} ${leadVariant.size}` : displayName;
  const stock = getStockPresentation(product);
  const purity = documentedPurityLabel(product, leadVariant);
  const compactPurity = purity ? purity.replace('.00', '').replace(' (documented)', '') : null;

  return (
    <div className="relative mx-auto w-full max-w-[360px]">
      <img
        src="/hero/ring.png"
        alt=""
        className="pointer-events-none absolute top-1/2 left-1/2 z-0 w-[150%] max-w-none -translate-x-1/2 -translate-y-1/2 select-none"
        aria-hidden="true"
      />

      <div className="relative z-10">
        <div className="absolute -top-3 -right-2 z-20 max-w-[11.5rem] rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-lg shadow-slate-900/10">
          <div className="flex items-start gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
              <Star className="h-4 w-4 fill-amber-400" />
            </span>
            <div>
              <p className="font-mono text-[11px] font-bold text-slate-900">Featured listing</p>
              <p className="text-[10px] leading-tight text-slate-500">Highlighted from the published catalogue</p>
            </div>
          </div>
        </div>

        {stock.inStock && (
          <div className="absolute top-[42%] -left-4 z-20 hidden rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-lg shadow-slate-900/10 sm:block">
            <div className="flex items-start gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Check className="h-4 w-4" strokeWidth={3} />
              </span>
              <div>
                <p className="font-mono text-[11px] font-bold text-slate-900">{stock.label}</p>
                <p className="text-[10px] leading-tight text-slate-500">Live stock from the catalogue</p>
              </div>
            </div>
          </div>
        )}

        {compactPurity && (
          <div className="absolute right-[-0.75rem] bottom-16 z-20 max-w-[11rem] rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-lg shadow-slate-900/10">
            <div className="flex items-start gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#4353FF]">
                <Shield className="h-4 w-4" />
              </span>
              <div>
                <p className="font-mono text-[11px] font-bold text-slate-900">{compactPurity}</p>
                <p className="text-[10px] leading-tight text-slate-500">From the batch record</p>
              </div>
            </div>
          </div>
        )}

        <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
          <div className="relative bg-gradient-to-b from-slate-50 to-white px-6 pt-6 pb-2">
            <div className="absolute top-4 left-4 z-10 inline-flex items-center gap-1 rounded-full bg-[#1e3a8a] px-3 py-1 font-mono text-[10px] font-bold tracking-wide text-amber-300 uppercase">
              <Star className="h-3 w-3 fill-amber-300" />
              {isBestseller ? 'UK bestseller' : 'Featured'}
            </div>

            {primaryImage ? (
              <img src={primaryImage} alt={title} className="mx-auto h-52 w-auto object-contain" />
            ) : (
              <div className="mx-auto flex h-52 items-center justify-center font-mono text-xs text-slate-400">
                No photograph
              </div>
            )}

            <div className="absolute bottom-3 left-6 inline-flex items-center gap-1.5 rounded-full bg-[#1e3a8a] px-3 py-1 font-mono text-[10px] font-bold tracking-wide text-white uppercase">
              <span aria-hidden="true">🇬🇧</span>
              UK supplied
            </div>
          </div>

          <div className="space-y-3 px-6 pt-4 pb-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                {stock.inStock && (
                  <p className="mb-1 flex items-center gap-1.5 font-mono text-[11px] font-semibold text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {stock.label}
                  </p>
                )}
                <h2 className="text-xl font-bold tracking-tight text-slate-900">{title}</h2>
              </div>
              {compactPurity && (
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 font-mono text-[10px] font-bold text-slate-600">
                  {compactPurity}
                </span>
              )}
            </div>

            <p className="text-sm leading-relaxed text-slate-500">
              GHRH analogue used in laboratory studies of growth-hormone signalling and metabolic research models. For
              in-vitro research only.
            </p>

            <div className="flex items-end justify-between gap-3 pt-1">
              <div>
                <p className="text-2xl font-bold tracking-tight text-slate-900">{formatProductPriceFrom(product)}</p>
                <p className="text-[11px] text-slate-400">ex. VAT · research use only</p>
              </div>
              <AppLink
                href={productPath(product.slug)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1d4ed8] px-4 py-2.5 font-mono text-xs font-bold tracking-wider text-white uppercase shadow-md shadow-blue-600/30 hover:bg-[#1e40af]"
              >
                <Plus className="h-4 w-4" strokeWidth={3} />
                Order
              </AppLink>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};
