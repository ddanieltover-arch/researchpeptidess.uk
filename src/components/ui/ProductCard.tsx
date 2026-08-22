import React, { useState } from 'react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { formatPrice } from '../../lib/utils';
import { Badge } from './Badge';
import { Button } from './Button';
import { Heart, ShoppingBag, ArrowUpRight, ShieldCheck, Check } from 'lucide-react';

export interface ProductCardProps {
  product: Product;
  featured?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { selectProductBySlug, addToCart, wishlist, toggleWishlist, currency } = useStore();
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants[0]?.id || ''
  );
  const [isAdding, setIsAdding] = useState(false);

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];

  const isWishlisted = wishlist.includes(product.id);
  const primaryImage = product.images[0]?.url || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80';

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAdding(true);
    addToCart(product, selectedVariant.id, 1);
    setTimeout(() => {
      setIsAdding(false);
    }, 600);
  };

  return (
    <div
      onClick={() => selectProductBySlug(product.slug)}
      className="group flex flex-col bg-white border border-slate-200 hover:border-[#4353FF] hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 cursor-pointer overflow-hidden rounded-xl"
    >
      {/* Top Image Canvas */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-50 border-b border-slate-100 flex items-center justify-center p-6">
        {/* Purity Badge */}
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1">
          <div className="bg-white/95 backdrop-blur-xs px-2.5 py-1 border border-slate-200 text-[10px] font-mono font-bold uppercase text-[#4353FF] tracking-wider rounded-md shadow-xs">
            ≥{selectedVariant?.purityScore || 99.0}% HPLC
          </div>
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute right-3 top-3 z-10 rounded-lg p-2 transition-colors ${
            isWishlisted
              ? 'bg-[#4353FF] text-white shadow-xs'
              : 'bg-white/90 text-slate-400 hover:text-[#4353FF] border border-slate-200'
          }`}
          title={isWishlisted ? 'Remove from saved' : 'Save to requisition list'}
        >
          <Heart className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-white' : ''}`} />
        </button>

        {/* Product Image */}
        <img
          src={primaryImage}
          alt={product.name}
          className="h-full w-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* In-Vitro Notice Pill */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] text-slate-600 bg-white/95 backdrop-blur-xs px-2.5 py-1 border border-slate-200 rounded-md font-mono">
          <span className="flex items-center gap-1 font-bold uppercase tracking-wider text-slate-800">
            <ShieldCheck className="h-3.5 w-3.5 text-[#0EA5E9]" />
            In-Vitro Grade
          </span>
          <span className="text-[10px] text-slate-500 font-semibold">
            {selectedVariant?.stock > 0 ? `${selectedVariant.stock} in Stock` : 'Out of Stock'}
          </span>
        </div>
      </div>

      {/* Product Body */}
      <div className="flex flex-1 flex-col p-4">
        {/* Name & Subtitle */}
        <div className="flex-1">
          <div className="flex items-center justify-between gap-1 mb-1 font-mono">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
              {selectedVariant?.sku}
            </span>
            {selectedVariant?.casNumber && (
              <span className="text-[10px] text-slate-400">
                CAS: {selectedVariant.casNumber}
              </span>
            )}
          </div>

          <h3 className="font-bold text-sm mb-1 text-slate-900 group-hover:text-[#4353FF] transition-colors leading-snug flex items-center justify-between font-mono">
            <span>{product.name} • {selectedVariant.size}</span>
            <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#4353FF] shrink-0" />
          </h3>

          <p className="text-xs text-slate-500 mb-3 font-sans line-clamp-1">
            {product.categoryName || 'Research Peptide Solution'}
          </p>
        </div>

        {/* Variant Selection Chips */}
        {product.variants.length > 1 && (
          <div className="mb-3 flex flex-wrap gap-1.5 pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
            {product.variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariantId(v.id)}
                className={`rounded-md px-2.5 py-1 text-[10px] font-mono font-bold uppercase transition-all ${
                  v.id === selectedVariant.id
                    ? 'bg-[#4353FF] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {v.size}
              </button>
            ))}
          </div>
        )}

        {/* Price & Action Row */}
        <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-auto font-mono">
          <div>
            <span className="text-base font-extrabold text-slate-900">
              {formatPrice(selectedVariant.price, currency)}
              <span className="text-[10px] text-slate-400 font-normal ml-1">/ vial</span>
            </span>
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={isAdding}
            className="text-xs font-bold uppercase tracking-wider text-[#4353FF] hover:text-[#3846E0] flex items-center gap-1 group-hover:underline font-mono"
          >
            {isAdding ? (
              <span className="text-slate-900">Adding...</span>
            ) : (
              <span>+ Add to Cart</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
