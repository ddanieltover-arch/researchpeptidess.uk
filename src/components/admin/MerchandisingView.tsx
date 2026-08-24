import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { calculateBestsellerScores } from '../../lib/merchandising';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const MerchandisingView: React.FC = () => {
  const { products, orders, saveProductMerchandising } = useStore();
  const scores = calculateBestsellerScores(orders);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const rows = [...products].sort((a, b) => {
    const priority = (b.merchandising?.priority || 0) - (a.merchandising?.priority || 0);
    if (priority !== 0) return priority;
    return (scores.get(b.id)?.score || 0) - (scores.get(a.id)?.score || 0);
  });

  const run = async (productId: string, action: () => Promise<boolean>) => {
    setPendingId(productId);
    try {
      await action();
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-stone-200 bg-white p-4 text-xs text-slate-600">
        <h3 className="font-mono text-sm font-bold text-slate-900">Catalogue merchandising</h3>
        <p className="mt-1">
          Featured, pins, exclusions, and priority are stored in Neon. Bestseller labels still require completed-order
          sales. Changes survive refresh, logout, and deployment.
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="min-w-full text-left text-xs">
          <thead className="border-b border-stone-200 bg-stone-50 font-mono uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Units sold</th>
              <th className="px-3 py-2">Score</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Featured</th>
              <th className="px-3 py-2">Pin bestseller rail</th>
              <th className="px-3 py-2">Exclude</th>
              <th className="px-3 py-2">New arrival pin</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((product) => {
              const stats = scores.get(product.id);
              const busy = pendingId === product.id;
              return (
                <tr key={product.id} className="border-b border-stone-100">
                  <td className="px-3 py-2 font-semibold text-slate-900">{product.name}</td>
                  <td className="px-3 py-2 font-mono">{stats?.unitsSold || 0}</td>
                  <td className="px-3 py-2 font-mono">{stats?.score || 0}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      disabled={busy}
                      className="w-16 rounded border border-stone-300 px-1 py-0.5 font-mono text-xs"
                      value={product.merchandising?.priority || 0}
                      onChange={(event) =>
                        void run(product.id, () =>
                          saveProductMerchandising(product.id, {
                            merchandisingPriority: Number(event.target.value) || 0,
                          })
                        )
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      size="sm"
                      disabled={busy}
                      variant={product.isFeatured ? 'primary' : 'outline'}
                      onClick={() =>
                        void run(product.id, () =>
                          saveProductMerchandising(product.id, { featured: !product.isFeatured })
                        )
                      }
                    >
                      {product.isFeatured ? 'Featured' : 'Off'}
                    </Button>
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      size="sm"
                      disabled={busy}
                      variant={product.merchandising?.bestsellerPinned ? 'primary' : 'outline'}
                      onClick={() =>
                        void run(product.id, () =>
                          saveProductMerchandising(product.id, {
                            bestsellerOverride: !product.merchandising?.bestsellerPinned,
                          })
                        )
                      }
                    >
                      {product.merchandising?.bestsellerPinned ? 'Pinned' : 'Pin'}
                    </Button>
                    {(stats?.unitsSold || 0) === 0 && (
                      <Badge variant="neutral" size="sm" className="ml-2">
                        No sales
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      size="sm"
                      disabled={busy}
                      variant={product.merchandising?.excludeFromBestsellers ? 'primary' : 'outline'}
                      onClick={() =>
                        void run(product.id, () =>
                          saveProductMerchandising(product.id, {
                            bestsellerExcluded: !product.merchandising?.excludeFromBestsellers,
                          })
                        )
                      }
                    >
                      {product.merchandising?.excludeFromBestsellers ? 'Excluded' : 'Include'}
                    </Button>
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      size="sm"
                      disabled={busy}
                      variant={product.merchandising?.newArrivalPinned ? 'primary' : 'outline'}
                      onClick={() =>
                        void run(product.id, () =>
                          saveProductMerchandising(product.id, {
                            newArrivalOverride: !product.merchandising?.newArrivalPinned,
                          })
                        )
                      }
                    >
                      {product.merchandising?.newArrivalPinned ? 'Pinned' : 'Pin'}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
