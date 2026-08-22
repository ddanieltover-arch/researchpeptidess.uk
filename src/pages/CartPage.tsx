import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { formatPrice } from '../lib/utils';
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Zap,
  Package,
  ArrowLeft,
  Percent,
  Lock,
} from 'lucide-react';

export const CartPage: React.FC = () => {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartTotals,
    currency,
    navigate,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    selectedShippingZone,
    setSelectedShippingZone,
  } = useStore();

  const [couponInput, setCouponInput] = useState('');

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponInput.trim()) {
      applyCoupon(couponInput.trim());
      setCouponInput('');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center text-[#4353FF] mx-auto border border-blue-200">
          <Package className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold font-mono text-slate-900">Your Requisition Basket is Empty</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Explore our certified British analytical peptides, blends, and standards.
        </p>
        <Button variant="primary" size="md" onClick={() => navigate('/shop')} className="font-mono text-xs shadow-md shadow-blue-500/20">
          Browse Requisition Catalogue
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Shop Catalogue', onClick: () => navigate('/shop') },
          { label: 'Requisition Basket' },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#4353FF]">
            Requisition Review
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-950 tracking-tight mt-0.5">
            Order Basket ({cart.reduce((s, i) => s + i.quantity, 0)} items)
          </h1>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-rose-600 hover:text-rose-800 font-mono transition-colors self-start sm:self-auto"
        >
          Clear Basket
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Cart Items Table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-12 text-[11px] font-bold uppercase font-mono text-slate-700">
              <div className="col-span-6">Compound Details</div>
              <div className="col-span-2 text-center">Unit Price</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-right">Line Total</div>
            </div>

            <div className="divide-y divide-slate-100">
              {cart.map((item) => (
                <div key={item.variantId} className="p-4 grid grid-cols-12 items-center gap-2">
                  <div className="col-span-6 flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="h-14 w-14 rounded-md object-cover border border-slate-200 bg-slate-50 shrink-0"
                    />
                    <div className="min-w-0 space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-900 truncate font-mono">{item.productName}</h4>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                        <span className="bg-blue-50 text-[#4353FF] px-1.5 py-0.5 rounded-sm font-bold">
                          {item.size}
                        </span>
                        <span>SKU: {item.sku}</span>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.variantId)}
                        className="text-[10px] text-rose-600 hover:text-rose-800 font-mono flex items-center gap-1 pt-0.5"
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="col-span-2 text-center font-mono text-xs text-slate-700 font-semibold">
                    {formatPrice(item.unitPrice, currency)}
                  </div>

                  <div className="col-span-2 flex justify-center">
                    <div className="flex items-center border border-slate-300 rounded-md bg-slate-50">
                      <button
                        onClick={() => updateCartQuantity(item.variantId, -1)}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-200 cursor-pointer"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-2 text-xs font-mono font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.variantId, 1)}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-200 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <div className="col-span-2 text-right font-mono text-xs font-bold text-slate-900">
                    {formatPrice(item.unitPrice * item.quantity, currency)}
                    {item.quantity >= 3 && (
                      <span className="block text-[9px] text-emerald-700 font-normal">
                        Bulk discount applied
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/shop')}
              className="gap-1 font-mono text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Continue Adding Compounds</span>
            </Button>
          </div>
        </div>

        {/* Right: Summary Box & Checkout Gate */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5">
            <h3 className="text-base font-bold font-mono text-slate-950 pb-3 border-b border-slate-100">
              Requisition Summary
            </h3>

            {/* Shipping Destination Selector */}
            <div className="space-y-1.5 text-xs font-mono">
              <label className="text-slate-700 font-semibold uppercase text-[10px] tracking-wider block">
                Dispatch Destination:
              </label>
              <select
                value={selectedShippingZone}
                onChange={(e) => setSelectedShippingZone(e.target.value as any)}
                className="w-full h-9 rounded-md border border-slate-300 bg-slate-50 px-2.5 text-xs focus:outline-none focus:border-[#4353FF] focus:ring-1 focus:ring-[#4353FF]"
              >
                <option value="UK_STANDARD">UK Tracked 24 (£4.99 or Free over £75)</option>
                <option value="UK_EXPRESS">UK Guaranteed Next-Day 1PM (£8.99)</option>
                <option value="EUROPE">European Tracked Airmail (€14.99)</option>
              </select>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Gross)</span>
                <span className="font-mono">{formatPrice(cartTotals.subtotal, currency)}</span>
              </div>

              {cartTotals.itemDiscounts > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Tier Volume Savings</span>
                  <span className="font-mono">-{formatPrice(cartTotals.itemDiscounts, currency)}</span>
                </div>
              )}

              {cartTotals.couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Coupon Discount ({appliedCoupon})</span>
                  <span className="font-mono">-{formatPrice(cartTotals.couponDiscount, currency)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Shipping Fee</span>
                <span className="font-mono">
                  {cartTotals.shippingFee === 0 ? 'FREE' : formatPrice(cartTotals.shippingFee, currency)}
                </span>
              </div>

              <div className="flex justify-between text-base font-extrabold text-slate-950 pt-3 border-t border-slate-200">
                <span className="font-mono">Authoritative Total</span>
                <span className="font-mono text-lg text-[#4353FF] font-black">
                  {formatPrice(cartTotals.total, currency)}
                </span>
              </div>
            </div>

            {/* Crypto 5% discount preview */}
            <div className="rounded-xl bg-blue-50/70 border border-blue-200 p-3 text-[11px] text-blue-950 space-y-1 font-mono">
              <div className="flex items-center gap-1 font-bold text-[#4353FF]">
                <Zap className="h-3.5 w-3.5 text-[#4353FF]" />
                <span>5% Crypto Settlement Benefit:</span>
              </div>
              <p className="font-sans text-[11px] text-slate-700">
                Switch to BTC, ETH or USDT at checkout to pay only{' '}
                <strong className="font-mono font-bold text-[#4353FF]">
                  {formatPrice(cartTotals.total * 0.95, currency)}
                </strong>
                .
              </p>
            </div>

            {/* Coupon Code Input */}
            <form onSubmit={handleApplyCoupon} className="space-y-1.5 pt-1">
              <div className="flex gap-2">
                <Input
                  placeholder="Coupon code (e.g. RESEARCH10)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="text-xs h-9 font-mono uppercase"
                />
                <Button type="submit" variant="secondary" size="sm" className="font-mono text-xs shrink-0">
                  Apply
                </Button>
              </div>
              {appliedCoupon && (
                <div className="flex items-center justify-between text-[11px] text-emerald-700 font-mono">
                  <span>Active code: {appliedCoupon}</span>
                  <button onClick={removeCoupon} className="text-rose-600 hover:underline">
                    Remove
                  </button>
                </div>
              )}
            </form>

            {/* Proceed to Checkout Button */}
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/checkout')}
              className="w-full font-mono text-sm tracking-wide shadow-md shadow-blue-500/20 justify-center"
            >
              <span>Proceed to Requisition Checkout</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 font-mono">
              <Lock className="h-3.5 w-3.5 text-emerald-600" />
              <span>256-bit Encrypted Settlement &amp; UK Compliance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
