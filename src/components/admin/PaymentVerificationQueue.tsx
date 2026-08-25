import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { formatPrice, formatDate } from '../../lib/utils';
import { Payment, PaymentStatus } from '../../types';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Coins,
  Building2,
  FileCheck2,
  Eye,
  AlertTriangle,
  Search,
  Filter,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

export const PaymentVerificationQueue: React.FC = () => {
  const {
    payments,
    orders,
    verifyPayment,
    rejectPayment,
    currency,
    currentUser,
    addToast,
  } = useStore();

  const [filterTab, setFilterTab] = useState<'PENDING' | 'VERIFIED' | 'ALL'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Verification modal state
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');

  // Rejection modal state
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const filteredPayments = payments.filter((payment) => {
    // Tab filter
    if (filterTab === 'PENDING') {
      const isPending =
        payment.status === 'SUBMITTED' ||
        payment.status === 'UNDER_REVIEW' ||
        payment.status === 'AWAITING_CUSTOMER_ACTION';
      if (!isPending) return false;
    } else if (filterTab === 'VERIFIED') {
      if (payment.status !== 'VERIFIED') return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = payment.reference.toLowerCase().includes(q);
      const matchOrder = payment.orderNumber.toLowerCase().includes(q);
      const matchTx = payment.transactionHash?.toLowerCase().includes(q);
      if (!matchRef && !matchOrder && !matchTx) return false;
    }

    return true;
  });

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'SUBMITTED':
        return <Badge variant="gold" size="sm">Evidence Submitted</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="warning" size="sm">Under Review</Badge>;
      case 'AWAITING_CUSTOMER_ACTION':
        return <Badge variant="neutral" size="sm">Awaiting Evidence</Badge>;
      case 'VERIFIED':
        return <Badge variant="success" size="sm">Verified & Settled</Badge>;
      case 'FAILED':
        return <Badge variant="destructive" size="sm">Rejected / Failed</Badge>;
      case 'EXPIRED':
        return <Badge variant="destructive" size="sm">Expired</Badge>;
      case 'REFUNDED':
        return <Badge variant="destructive" size="sm">Refunded</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  const handleVerifyConfirm = () => {
    if (!selectedPayment) return;
    const success = verifyPayment(selectedPayment.id, verifyNotes || 'Payment verified by administrator');
    if (success) {
      setIsVerifyModalOpen(false);
      setSelectedPayment(null);
      setVerifyNotes('');
    }
  };

  const handleRejectConfirm = () => {
    if (!selectedPayment) return;
    if (!rejectReason.trim()) {
      addToast('error', 'Reason Required', 'Please provide a justification for rejecting the payment evidence.');
      return;
    }
    const success = rejectPayment(selectedPayment.id, rejectReason.trim());
    if (success) {
      setIsRejectModalOpen(false);
      setSelectedPayment(null);
      setRejectReason('');
    }
  };

  const associatedOrder = selectedPayment
    ? orders.find((o) => o.id === selectedPayment.orderId)
    : null;

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterTab('PENDING')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
              filterTab === 'PENDING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
            }`}
          >
            Pending Audit ({payments.filter((p) => p.status === 'SUBMITTED' || p.status === 'UNDER_REVIEW' || p.status === 'AWAITING_CUSTOMER_ACTION').length})
          </button>
          <button
            onClick={() => setFilterTab('VERIFIED')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
              filterTab === 'VERIFIED'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
            }`}
          >
            Verified ({payments.filter((p) => p.status === 'VERIFIED').length})
          </button>
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
              filterTab === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
            }`}
          >
            All Records ({payments.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search ref, order, tx hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-8"
          />
        </div>
      </div>

      {/* Queue Table */}
      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3">Payment Reference</th>
                <th className="p-3">Order Number</th>
                <th className="p-3">Method</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Evidence / Tx Hash</th>
                <th className="p-3">Status</th>
                <th className="p-3">Submitted</th>
                <th className="p-3 text-right">Verification Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 font-sans">
                    No payment records match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const ord = orders.find((o) => o.id === p.orderId);
                  const isPending =
                    p.status === 'SUBMITTED' ||
                    p.status === 'UNDER_REVIEW' ||
                    p.status === 'AWAITING_CUSTOMER_ACTION';

                  return (
                    <tr key={p.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="p-3 font-bold text-amber-900 font-mono">
                        {p.reference}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {p.orderNumber}
                        {ord && (
                          <span className="block text-[10px] text-slate-500 font-sans">
                            {ord.customerName}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                          {p.method === 'BANK_TRANSFER' ? (
                            <>
                              <Building2 className="h-3 w-3 text-slate-600" />
                              Faster Payments
                            </>
                          ) : (
                            <>
                              <Coins className="h-3 w-3 text-amber-600" />
                              Crypto ({p.cryptoDetails?.network || 'USDT'})
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-950">
                        {formatPrice(p.amount, p.currency || currency)}
                      </td>
                      <td className="p-3">
                        {p.transactionHash ? (
                          <span className="font-mono text-[10px] text-slate-700 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                            {p.transactionHash.slice(0, 16)}...
                          </span>
                        ) : p.evidenceNotes ? (
                          <span className="text-[10px] text-slate-600 italic">
                            {p.evidenceNotes}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-sans">Awaiting evidence</span>
                        )}
                      </td>
                      <td className="p-3">{getPaymentStatusBadge(p.status)}</td>
                      <td className="p-3 text-[10px] text-slate-500">
                        {p.submittedAt ? formatDate(p.submittedAt) : 'Pending'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPayment(p)}
                            className="text-[10px] h-7 px-2"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Inspect
                          </Button>

                          {isPending && (
                            <>
                              <Button
                                variant="gold"
                                size="sm"
                                onClick={() => {
                                  setSelectedPayment(p);
                                  setIsVerifyModalOpen(true);
                                }}
                                className="text-[10px] h-7 px-2 bg-emerald-700 hover:bg-emerald-800 text-white"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Verify
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedPayment(p);
                                  setIsRejectModalOpen(true);
                                }}
                                className="text-[10px] h-7 px-2 text-rose-700 hover:bg-rose-50 border-rose-200"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Inspection Modal */}
      {selectedPayment && !isVerifyModalOpen && !isRejectModalOpen && (
        <Modal
          isOpen={Boolean(selectedPayment)}
          onClose={() => setSelectedPayment(null)}
          title={`Payment Audit: Ref #${selectedPayment.reference}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs font-mono">
            {/* Status Summary Banner */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Payment Status</span>
                <div className="mt-1">{getPaymentStatusBadge(selectedPayment.status)}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block uppercase">Settlement Amount</span>
                <span className="text-lg font-bold text-slate-950">
                  {formatPrice(selectedPayment.amount, selectedPayment.currency || currency)}
                </span>
              </div>
            </div>

            {/* Order & Customer Info */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-lg border border-stone-200">
              <div>
                <span className="text-[10px] text-slate-500 block">Associated Order</span>
                <span className="font-bold text-slate-900">{selectedPayment.orderNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Payment Method</span>
                <span className="font-bold text-slate-900">
                  {selectedPayment.method === 'BANK_TRANSFER' ? 'UK Faster Payments' : 'Cryptocurrency'}
                </span>
              </div>
              {associatedOrder && (
                <>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Customer Name</span>
                    <span className="text-slate-800">{associatedOrder.customerName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Academic / Work Email</span>
                    <span className="text-slate-800">{associatedOrder.customerEmail}</span>
                  </div>
                </>
              )}
            </div>

            {/* Method Details */}
            {selectedPayment.method === 'BANK_TRANSFER' && selectedPayment.bankDetails && (
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-700 block">
                  Authoritative Bank Coordinates Issued:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>Account: <strong className="text-slate-900">{selectedPayment.bankDetails.accountName}</strong></div>
                  <div>Sort Code: <strong className="text-slate-900">{selectedPayment.bankDetails.sortCode}</strong></div>
                  <div>Account Number: <strong className="text-slate-900">{selectedPayment.bankDetails.accountNumber}</strong></div>
                  <div>Mandatory Reference: <strong className="text-amber-800">{selectedPayment.bankDetails.reference}</strong></div>
                </div>
              </div>
            )}

            {selectedPayment.method === 'CRYPTOCURRENCY' && selectedPayment.cryptoDetails && (
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-700 block">
                  Cryptographic Settlement Coordinates:
                </span>
                <div className="text-[11px] space-y-1">
                  <div>Network: <strong className="text-slate-900">{selectedPayment.cryptoDetails.network}</strong></div>
                  <div>Receiving Address: <span className="font-mono text-slate-800 break-all">{selectedPayment.cryptoDetails.walletAddress}</span></div>
                  <div>Expected Amount: <strong className="text-emerald-700">{selectedPayment.cryptoDetails.cryptoAmount || 'GBP order total — no live crypto quote'}</strong></div>
                </div>
              </div>
            )}

            {/* Submitted Evidence */}
            <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-amber-900 block">
                Submitted Transaction Evidence / Proof:
              </span>
              <div className="text-xs space-y-1">
                {selectedPayment.transactionHash && (
                  <div>
                    <span className="text-slate-600 block text-[10px]">Transaction Hash / FPS Ref:</span>
                    <span className="font-mono font-bold text-slate-900 break-all">{selectedPayment.transactionHash}</span>
                  </div>
                )}
                {selectedPayment.evidenceNotes && (
                  <div>
                    <span className="text-slate-600 block text-[10px]">Customer Audit Notes:</span>
                    <span className="text-slate-800">{selectedPayment.evidenceNotes}</span>
                  </div>
                )}
                {!selectedPayment.transactionHash && !selectedPayment.evidenceNotes && (
                  <span className="text-slate-500 italic">No evidence notes attached yet.</span>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-stone-200">
              <Button variant="outline" size="sm" onClick={() => setSelectedPayment(null)}>
                Close
              </Button>

              <div className="flex items-center gap-2">
                {(selectedPayment.status === 'SUBMITTED' ||
                  selectedPayment.status === 'UNDER_REVIEW' ||
                  selectedPayment.status === 'AWAITING_CUSTOMER_ACTION') && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsRejectModalOpen(true)}
                      className="text-rose-700 border-rose-200 hover:bg-rose-50"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Reject Evidence
                    </Button>
                    <Button
                      variant="gold"
                      size="sm"
                      onClick={() => setIsVerifyModalOpen(true)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Verify Payment
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Verify Confirmation Modal */}
      {isVerifyModalOpen && selectedPayment && (
        <Modal
          isOpen={isVerifyModalOpen}
          onClose={() => setIsVerifyModalOpen(false)}
          title={`Confirm Payment Verification: ${selectedPayment.reference}`}
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-950 font-sans">
              <p className="font-bold">Authoritative Settlement Confirmation</p>
              <p className="text-xs text-emerald-800 mt-1">
                Verifying this payment transitions the order status to <strong>PAYMENT_VERIFIED</strong> and enables cold dispatch packaging.
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-900 block mb-1">
                Administrative Audit Note (Optional):
              </label>
              <Input
                placeholder="e.g. Verified against NatWest Business Statement line #492"
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <Button variant="outline" onClick={() => setIsVerifyModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="gold" onClick={handleVerifyConfirm} className="bg-emerald-700 hover:bg-emerald-800 text-white">
                Confirm & Mark Verified
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Confirmation Modal */}
      {isRejectModalOpen && selectedPayment && (
        <Modal
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          title={`Reject Payment Evidence: ${selectedPayment.reference}`}
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-rose-950 font-sans">
              <p className="font-bold">Payment Rejection Audit Notice</p>
              <p className="text-xs text-rose-800 mt-1">
                Rejecting this evidence will mark the payment as <strong>FAILED</strong> and notify the customer to re-submit correct transaction details.
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-900 block mb-1">
                Rejection Reason (Required) *
              </label>
              <Input
                required
                placeholder="e.g. Reference mismatch: transaction not found in ledger"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="gold" onClick={handleRejectConfirm} className="bg-rose-700 hover:bg-rose-800 text-white">
                Reject Payment
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
