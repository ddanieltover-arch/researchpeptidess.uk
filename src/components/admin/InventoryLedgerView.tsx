import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { formatDate } from '../../lib/utils';
import {
  Layers,
  Search,
  Plus,
  AlertTriangle,
  RotateCw,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Package,
} from 'lucide-react';

export const InventoryLedgerView: React.FC = () => {
  const {
    products,
    inventoryTransactions,
    adjustVariantStock,
    currentUser,
    addToast,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustmentStock, setAdjustmentStock] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  // Collect all variants
  const allVariants = products.flatMap((p) =>
    p.variants.map((v) => ({
      ...v,
      productId: p.id,
      productName: p.name,
      productSku: p.sku,
      status: p.status,
    }))
  );

  const filteredTransactions = inventoryTransactions.filter((tx) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchVar = tx.variantId.toLowerCase().includes(q);
      const matchOrd = tx.orderId?.toLowerCase().includes(q);
      const matchType = tx.transactionType.toLowerCase().includes(q);
      const matchNotes = tx.notes?.toLowerCase().includes(q);
      if (!matchVar && !matchOrd && !matchType && !matchNotes) return false;
    }
    return true;
  });

  const handleAdjustSubmit = () => {
    if (!selectedVariantId) return;
    const stockVal = parseInt(adjustmentStock, 10);
    if (isNaN(stockVal) || stockVal < 0) {
      addToast('error', 'Invalid Stock', 'Stock level must be a non-negative integer.');
      return;
    }
    if (!adjustmentReason.trim()) {
      addToast('error', 'Reason Required', 'Mandatory stock adjustment reason required for audit trail.');
      return;
    }

    const success = adjustVariantStock(selectedVariantId, stockVal, adjustmentReason.trim());
    if (success) {
      setIsAdjustModalOpen(false);
      setSelectedVariantId('');
      setAdjustmentStock('');
      setAdjustmentReason('');
    }
  };

  const getTxTypeBadge = (type: string) => {
    switch (type) {
      case 'RESERVATION':
        return <Badge variant="warning" size="sm">Reservation Lock (-)</Badge>;
      case 'RELEASE':
        return <Badge variant="gold" size="sm">Reservation Release (+)</Badge>;
      case 'FULFILLMENT':
        return <Badge variant="scientific" size="sm">Fulfillment Deduct</Badge>;
      case 'ADJUSTMENT':
        return <Badge variant="neutral" size="sm">Manual Adjustment</Badge>;
      case 'RESTOCK':
        return <Badge variant="success" size="sm">Batch Restock (+)</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Controls & Current Stock Matrix */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider">
              Stock Matrix & Real-Time Availability
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Atomic inventory tracking ensuring no overselling, with automatic 24-hour reservation release locks.
            </p>
          </div>

          <Button
            variant="gold"
            size="sm"
            onClick={() => {
              if (allVariants[0]) {
                setSelectedVariantId(allVariants[0].id);
                setAdjustmentStock(allVariants[0].stockQuantity.toString());
              }
              setIsAdjustModalOpen(true);
            }}
            className="text-xs font-mono gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Manual Stock Adjustment</span>
          </Button>
        </div>

        {/* Variant Stock Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {allVariants.map((v) => {
            const isLowStock = v.stockQuantity < 10;
            return (
              <div
                key={v.id}
                className={`p-3 rounded-lg border transition-all ${
                  isLowStock
                    ? 'border-amber-300 bg-amber-50/40'
                    : 'border-stone-200 bg-stone-50/60'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-slate-900 block truncate" title={v.productName}>
                    {v.productName}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{v.sku}</span>
                </div>
                <div className="flex justify-between items-end mt-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Format / Size:</span>
                    <span className="font-semibold text-slate-800">{v.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Available:</span>
                    <span
                      className={`text-sm font-bold font-mono ${
                        v.stockQuantity === 0
                          ? 'text-rose-700'
                          : isLowStock
                          ? 'text-amber-800'
                          : 'text-slate-900'
                      }`}
                    >
                      {v.stockQuantity} units
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inventory Transaction Ledger */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-950 uppercase">
              Inventory Audit Ledger ({inventoryTransactions.length} Transactions)
            </h3>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search SKU, order, type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-8"
            />
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Transaction Type</th>
                  <th className="p-3">Variant SKU / ID</th>
                  <th className="p-3">Quantity Delta</th>
                  <th className="p-3">Balance After</th>
                  <th className="p-3">Associated Order</th>
                  <th className="p-3">Actor / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">
                      No inventory transactions recorded.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="p-3 text-[10px] text-slate-500">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className="p-3">{getTxTypeBadge(tx.transactionType)}</td>
                      <td className="p-3 font-mono font-bold text-slate-800">
                        {tx.variantId}
                      </td>
                      <td className="p-3 font-bold font-mono">
                        <span
                          className={
                            tx.quantityChange > 0
                              ? 'text-emerald-700'
                              : tx.quantityChange < 0
                              ? 'text-rose-700'
                              : 'text-slate-600'
                          }
                        >
                          {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-900 font-mono">
                        {tx.balanceAfter}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-700">
                        {tx.orderId || '—'}
                      </td>
                      <td className="p-3 text-[11px] text-slate-600">
                        {tx.notes || tx.actorEmail || 'System'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Manual Stock Adjustment Modal */}
      {isAdjustModalOpen && (
        <Modal
          isOpen={isAdjustModalOpen}
          onClose={() => setIsAdjustModalOpen(false)}
          title="Manual Inventory Stock Adjustment"
        >
          <div className="space-y-4 text-xs font-mono">
            <div>
              <label className="font-bold text-slate-900 block mb-1">Target Variant</label>
              <select
                value={selectedVariantId}
                onChange={(e) => {
                  setSelectedVariantId(e.target.value);
                  const found = allVariants.find((v) => v.id === e.target.value);
                  if (found) setAdjustmentStock(found.stockQuantity.toString());
                }}
                className="w-full bg-stone-50 border border-stone-300 rounded-md p-2 text-xs"
              >
                {allVariants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.productName} — {v.name} ({v.sku}) [Current: {v.stockQuantity}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-900 block mb-1">New Absolute Stock Level *</label>
              <Input
                type="number"
                min="0"
                required
                value={adjustmentStock}
                onChange={(e) => setAdjustmentStock(e.target.value)}
              />
            </div>

            <div>
              <label className="font-bold text-slate-900 block mb-1">
                Audit Reason / Justification *
              </label>
              <Input
                required
                placeholder="e.g. Physical inventory count reconciliation / batch intake"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <Button variant="outline" onClick={() => setIsAdjustModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="gold" onClick={handleAdjustSubmit}>
                Save Adjustment & Ledger Entry
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
