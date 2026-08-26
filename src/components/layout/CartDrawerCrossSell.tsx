import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Button } from '../ui/Button';
import { productPath } from '../../lib/routing';
import { getCartCrossSellProducts } from '../../lib/related-products';
import {
  formatProductDisplayName,
  formatProductPriceRange,
  getProductCardCta,
  getQuickAddVariant,
} from '../../lib/product-display';
import { Product } from '../../types';

export const CartDrawerCrossSell: React.FC = () => {
  const { cart, publishedProducts, addToCart, navigate, setCartDrawerOpen, currency } = useStore();

  const suggestions = useMemo(
    () => getCartCrossSellProducts(cart.map((item) => item.productId), publishedProducts, 3),
    [cart, publishedProducts]
  );

  if (suggestions.length === 0) return null;

  const openProduct = (product: Product) => {
    setCartDrawerOpen(false);
    navigate(productPath(product.slug));
  };

  return (
    <section className="space-y-3 border-t-2 border-[#4353FF] pt-4" aria-labelledby="cart-cross-sell-heading">
      <h3 id="cart-cross-sell-heading" className="text-sm font-bold text-slate-900">
        You May Also Like
      </h3>
      <ul className="space-y-3">
        {suggestions.map((product) => (
          <CartDrawerCrossSellItem
            key={product.id}
            product={product}
            currency={currency}
            onOpen={() => openProduct(product)}
            onAdd={() => {
              const variant = getQuickAddVariant(product);
              if (!variant) return;
              addToCart(product, variant.id, 1);
            }}
          />
        ))}
      </ul>
    </section>
  );
};

const CartDrawerCrossSellItem: React.FC<{
  product: Product;
  currency: 'GBP' | 'EUR';
  onOpen: () => void;
  onAdd: () => void;
}> = ({ product, currency, onOpen, onAdd }) => {
  const [isAdding, setIsAdding] = useState(false);
  const displayName = formatProductDisplayName(product.name || '');
  const primaryImage = product.images?.[0]?.url;
  const cta = getProductCardCta(product);

  const handleAdd = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (cta !== 'ADD_TO_CART') {
      onOpen();
      return;
    }
    setIsAdding(true);
    onAdd();
    window.setTimeout(() => setIsAdding(false), 600);
  };

  return (
    <li className="flex items-start gap-3">
      <button
        type="button"
        onClick={onOpen}
        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-stone-200 bg-stone-50"
        aria-label={`View ${displayName}`}
      >
        {primaryImage ? (
          <img src={primaryImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-mono text-[10px] text-slate-400">
            No image
          </span>
        )}
        <span className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-xs bg-white/90 text-slate-500">
          <Search className="h-2.5 w-2.5" aria-hidden="true" />
        </span>
      </button>
      <div className="min-w-0 flex-1 space-y-1.5">
        <button
          type="button"
          onClick={onOpen}
          className="block w-full truncate text-left text-sm font-semibold text-slate-900 hover:text-[#4353FF]"
        >
          {displayName}
        </button>
        <p className="font-mono text-xs text-slate-600">{formatProductPriceRange(product, currency)}</p>
        <Button
          type="button"
          variant="primary"
          size="sm"
          isLoading={isAdding}
          onClick={handleAdd}
          className="h-7 rounded-full px-4 text-[10px]"
          aria-label={
            cta === 'ADD_TO_CART'
              ? `Add ${displayName} to cart`
              : cta === 'SELECT_OPTIONS'
                ? `Select options for ${displayName}`
                : `View ${displayName}`
          }
        >
          {cta === 'ADD_TO_CART' ? 'Add' : cta === 'SELECT_OPTIONS' ? 'Options' : 'View'}
        </Button>
      </div>
    </li>
  );
};
