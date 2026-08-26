import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { RESEARCH10_CODE, RESEARCH10_MIN_SPEND } from '../../lib/pricing';
import { formatPrice } from '../../lib/utils';

export const CouponCodeForm: React.FC = () => {
  const { appliedCoupon, applyCoupon, removeCoupon, addToast, currency } = useStore();
  const [couponInput, setCouponInput] = useState('');

  const submitCode = () => {
    const code = couponInput.trim();
    if (!code) {
      addToast(
        'error',
        'Enter a coupon code',
        `${RESEARCH10_CODE} gives 10% off baskets of ${formatPrice(RESEARCH10_MIN_SPEND, currency)} or more.`
      );
      return;
    }
    if (applyCoupon(code)) {
      setCouponInput('');
    }
  };

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex gap-2">
        <Input
          placeholder={`${RESEARCH10_CODE} from ${formatPrice(RESEARCH10_MIN_SPEND, currency)}`}
          value={couponInput}
          onChange={(e) => setCouponInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submitCode();
            }
          }}
          className="text-xs h-9 font-mono uppercase"
          autoComplete="off"
          aria-label="Coupon code"
        />
        <Button type="button" variant="secondary" size="sm" className="font-mono text-xs shrink-0" onClick={submitCode}>
          Apply
        </Button>
      </div>
      <p className="text-[11px] text-slate-500 font-mono">
        {RESEARCH10_CODE}: 10% off from {formatPrice(RESEARCH10_MIN_SPEND, currency)} catalogue subtotal.
      </p>
      {appliedCoupon && (
        <div className="flex items-center justify-between text-[11px] text-emerald-700 font-mono">
          <span>Active code: {appliedCoupon.code}</span>
          <button type="button" onClick={removeCoupon} className="text-rose-600 hover:underline">
            Remove
          </button>
        </div>
      )}
    </div>
  );
};
