import React from 'react';
import { useStore } from '../../context/StoreContext';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { formatPrice } from '../../lib/utils';
import { DEFAULT_FREE_SHIPPING_THRESHOLD, isBankTransferAvailable, merchandiseTotalForPayment } from '../../lib/pricing';
import { Trash2, Plus, Minus, ArrowRight, Zap, Package } from 'lucide-react';
import { CartDrawerCrossSell } from './CartDrawerCrossSell';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    cartDrawerOpen,
    setCartDrawerOpen,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartTotals,
    currency,
    navigate,
  } = useStore();
  const bankTransferAvailable = isBankTransferAvailable(merchandiseTotalForPayment(cartTotals));

  const handleCheckoutClick = () => {
    setCartDrawerOpen(false);
    navigate('/checkout');
  };

  const handleViewCartClick = () => {
    setCartDrawerOpen(false);
    navigate('/cart');
  };

  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <Drawer
      isOpen={cartDrawerOpen}
      onClose={() => setCartDrawerOpen(false)}
      title="Basket"
      subtitle={`${itemCount} ${itemCount === 1 ? 'item' : 'items'} selected`}
      width="md"
      footer={
        cart.length > 0 ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                <span className="flex items-center gap-1">
                  <Package className="h-3.5 w-3.5 text-amber-600" />
                  {cartTotals.freeShippingQualified
                    ? 'Free UK Tracked Delivery Qualified'
                    : `Add ${formatPrice(cartTotals.amountNeededForFreeShipping, currency)} for Free UK Shipping`}
                </span>
                <span className="font-mono text-[11px] font-bold text-slate-900">
                  {formatPrice(DEFAULT_FREE_SHIPPING_THRESHOLD, currency)} Threshold
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-stone-200 overflow-hidden">
                <div
                  className="h-full bg-amber-600 transition-all duration-300 rounded-full"
                  style={{
                    width: `${Math.min(100, (cartTotals.subtotal / DEFAULT_FREE_SHIPPING_THRESHOLD) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Calculations Summary */}
            <div className="space-y-1.5 pt-2 border-t border-stone-200 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (ex. VAT)</span>
                <span className="font-mono">{formatPrice(cartTotals.subtotal, currency)}</span>
              </div>
              {cartTotals.itemDiscounts > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Bulk Tier Discounts</span>
                  <span className="font-mono">-{formatPrice(cartTotals.itemDiscounts, currency)}</span>
                </div>
              )}
              {cartTotals.cryptoDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Crypto Discount (5%)</span>
                  <span className="font-mono">-{formatPrice(cartTotals.cryptoDiscount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Estimated shipping</span>
                <span className="font-mono">
                  {cartTotals.shippingFee === 0 ? 'FREE' : formatPrice(cartTotals.shippingFee, currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-950 pt-2 border-t border-stone-200">
                <span>Estimated Total</span>
                <span className="font-mono text-base text-amber-900 font-extrabold">
                  {formatPrice(cartTotals.total, currency)}
                </span>
              </div>
            </div>

            {/* Crypto savings callout */}
            <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 p-2 text-[11px] text-amber-900 font-mono">
              <Zap className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>
                {!bankTransferAvailable
                  ? 'Cryptocurrency is the settlement option below £100, with 5% already applied. Bank transfer is available from £100.'
                  : 'Choose crypto at checkout for an extra 5% discount. Bank transfer is available from £100.'}
              </span>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button variant="outline" size="md" onClick={handleViewCartClick}>
                View Cart
              </Button>
              <Button variant="gold" size="md" onClick={handleCheckoutClick}>
                <span>Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : undefined
      }
    >
      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center py-12">
          <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center text-slate-400 mb-3 border border-stone-200">
            <Package className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Your basket is empty</h4>
          <p className="text-xs text-slate-500 max-w-xs mt-1">
            Browse the research peptide catalogue and add published analytical items.
          </p>
          <Button
            variant="primary"
            size="sm"
            className="mt-4"
            onClick={() => {
              setCartDrawerOpen(false);
              navigate('/shop');
            }}
          >
            Explore Catalogue
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <span className="text-xs text-slate-500 font-mono">Selected Compounds</span>
            <button
              onClick={clearCart}
              className="text-[11px] text-rose-600 hover:text-rose-800 transition-colors"
            >
              Clear all
            </button>
          </div>

          <div className="divide-y divide-stone-100 space-y-3">
            {cart.map((item) => (
              <div key={item.variantId} className="pt-3 first:pt-0 flex gap-3">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="h-16 w-16 rounded-md object-cover border border-stone-200 shrink-0 bg-stone-50"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-stone-200 bg-stone-50 font-mono text-[10px] text-slate-400">
                    No image
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-1">
                    <h5 className="text-xs font-bold text-slate-900 leading-snug truncate">
                      {item.productName}
                    </h5>
                    <button
                      onClick={() => removeFromCart(item.variantId)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                    <span className="bg-stone-100 px-1.5 py-0.5 rounded-xs font-medium text-slate-700">
                      {item.size}
                    </span>
                    <span>SKU: {item.sku}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center border border-stone-300 rounded-md bg-stone-50">
                      <button
                        onClick={() => updateCartQuantity(item.variantId, -1)}
                        className="px-2 py-1 text-slate-600 hover:bg-stone-200 transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-2 text-xs font-mono font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.variantId, 1)}
                        className="px-2 py-1 text-slate-600 hover:bg-stone-200 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold font-mono text-slate-900">
                        {formatPrice(item.unitPrice * item.quantity, currency)}
                      </span>
                      {item.quantity >= 3 && (
                        <div className="text-[10px] text-emerald-700 font-semibold font-mono">
                          Bulk Tier Active
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <CartDrawerCrossSell />
        </div>
      )}
    </Drawer>
  );
};
