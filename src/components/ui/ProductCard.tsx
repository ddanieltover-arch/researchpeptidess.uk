import React from 'react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { Heart, ArrowUpRight } from 'lucide-react';
import { AppLink } from './AppLink';
import { Button } from './Button';
import { productPath } from '../../lib/routing';
import {
  formatProductDisplayName,
  formatProductPriceRange,
  getProductCardCta,
  getQuickAddVariant,
  getStockPresentation,
} from '../../lib/product-display';

export interface ProductCardProps {
  product: Product;
  featured?: boolean;
  layout?: 'grid' | 'list';
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, layout = 'grid' }) => {
  const { addToCart, wishlist, toggleWishlist, currency, navigate } = useStore();
  const [isAdding, setIsAdding] = React.useState(false);

  const selectedVariant = getQuickAddVariant(product);
  const isWishlisted = wishlist.includes(product.id);
  const primaryImage = product.images?.[0]?.url;
  const cta = getProductCardCta(product);
  const stock = getStockPresentation(product);
  const displayName = formatProductDisplayName(product.name || '');
  const isList = layout === 'list';

  const handleQuickAdd = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!selectedVariant) return;
    setIsAdding(true);
    addToCart(product, selectedVariant.id, 1);
    setTimeout(() => setIsAdding(false), 600);
  };

  return (
    <article
      className={`group relative flex overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-200 hover:border-[#4353FF] hover:shadow-lg hover:shadow-blue-500/10 ${
        isList ? 'flex-col sm:flex-row' : 'flex-col'
      }`}
    >
      <button
        type="button"
        onClick={() => toggleWishlist(product.id)}
        className={`absolute right-3 top-3 z-10 rounded-lg p-2 transition-colors ${
          isWishlisted
            ? 'bg-[#4353FF] text-white shadow-xs'
            : 'border border-slate-200 bg-white/90 text-slate-400 hover:text-[#4353FF]'
        }`}
        title={isWishlisted ? 'Remove from saved' : 'Save compound'}
      >
        <Heart className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-white' : ''}`} />
      </button>

      <AppLink
        href={productPath(product.slug)}
        className={`relative block overflow-hidden border-b border-slate-100 bg-slate-50 ${
          isList ? 'h-48 sm:h-auto sm:w-56 sm:self-stretch sm:border-b-0 sm:border-r' : 'aspect-4/3 w-full'
        }`}
      >
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={displayName}
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full min-h-32 w-full items-center justify-center font-mono text-[11px] text-slate-400">
            No image
          </div>
        )}
      </AppLink>

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <AppLink href={productPath(product.slug)} className="flex-1">
          <p className="mb-1 font-display text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
            {product.categoryName || 'Catalogue'}
          </p>
          <h3 className="mb-1 flex items-start justify-between gap-2 font-display text-[15px] font-semibold leading-snug tracking-[-0.02em] text-slate-900 group-hover:text-[#4353FF]">
            <span>{displayName}</span>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-[#4353FF] opacity-0 transition-opacity group-hover:opacity-100" />
          </h3>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] font-semibold text-emerald-700">{stock.label}</span>
          </div>
        </AppLink>

        <div
          className={`mt-auto min-w-0 border-t border-slate-100 pt-3 font-mono ${
            isList
              ? 'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'
              : 'flex min-w-0 flex-col gap-2.5'
          }`}
        >
          <span className="min-w-0 text-sm font-display font-bold tabular-nums tracking-tight text-slate-900 sm:text-base">
            {formatProductPriceRange(product, currency)}
          </span>

          {cta === 'ADD_TO_CART' ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleQuickAdd}
              isLoading={isAdding}
              className={`max-w-full px-3 tracking-[0.08em] ${isList ? 'w-full sm:w-auto' : 'w-full'}`}
              aria-label={`Add ${displayName} to cart`}
            >
              Add to cart
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => navigate(productPath(product.slug))}
              className={`max-w-full px-3 tracking-[0.08em] ${isList ? 'w-full sm:w-auto' : 'w-full'}`}
              aria-label={
                cta === 'SELECT_OPTIONS' ? `Select options for ${displayName}` : `View ${displayName}`
              }
            >
              {cta === 'SELECT_OPTIONS' ? 'Select options' : 'View details'}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
};
