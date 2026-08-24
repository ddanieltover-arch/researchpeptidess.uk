import React from 'react';
import { ShippingMethod } from '../../types';
import { calculateEligibleShippingMethods } from '../../lib/shipping-engine';
import { formatPrice } from '../../lib/utils';

interface ProductShippingPanelProps {
  shippingMethods: ShippingMethod[];
  countryCode: string;
  subtotal: number;
  currency: 'GBP' | 'EUR';
}

export const ProductShippingPanel: React.FC<ProductShippingPanelProps> = ({
  shippingMethods,
  countryCode,
  subtotal,
  currency,
}) => {
  const calculation = calculateEligibleShippingMethods(countryCode, subtotal, shippingMethods);

  if (!calculation.isAvailable) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-900">Shipping</h3>
        <p className="mt-2">{calculation.error || 'No shipping methods are configured for this destination.'}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
      <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-900">Shipping from configured methods</h3>
      <p className="mt-1 text-slate-600">
        Destination: {calculation.countryName}. Values below come from the live shipping engine, not marketing claims.
      </p>
      <ul className="mt-3 space-y-2">
        {calculation.eligibleMethods.map((entry) => (
          <li key={entry.method.id} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{entry.method.name}</p>
                <p className="text-[11px] text-slate-500">{entry.method.carrier}</p>
              </div>
              <p className="font-mono font-bold text-slate-900">
                {entry.freeShippingQualified ? 'Included' : formatPrice(entry.calculatedPrice, currency)}
              </p>
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div>
                <dt className="uppercase tracking-wider text-slate-400">Window</dt>
                <dd>{entry.method.estimatedDays}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-wider text-slate-400">Tracking</dt>
                <dd>{entry.method.trackingAvailable ? 'Available after dispatch' : 'Not configured'}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
};
