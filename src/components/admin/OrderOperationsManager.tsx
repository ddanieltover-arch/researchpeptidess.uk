import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { formatPrice, formatDate } from '../../lib/utils';
import { Order, OrderStatus, Payment } from '../../types';
import {
  Truck,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  ShieldCheck,
  Building2,
  Coins,
  History,
  FileCheck2,
  Send,
  AlertCircle,
  Package,
  Pencil,
  Trash2,
} from 'lucide-react';

export const OrderOperationsManager: React.FC = () => {
  const {
    orders,
    payments,
    updateOrderStatus,
    cancelOrder,
    processRefund,
    saveOrderEdits,
    deleteOrder,
    currency,
    currentUser,
    addToast,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Dispatch modal
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [carrierInput, setCarrierInput] = useState('Royal Mail Tracked 24');
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');

  // Cancel modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Refund modal
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  // State Override modal
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideTargetStatus, setOverrideTargetStatus] = useState<OrderStatus>('PROCESSING');
  const [overrideJustification, setOverrideJustification] = useState('');

  // Edit / Delete
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState({
    customerName: '',
    customerEmail: '',
    phone: '',
    institution: '',
    department: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    county: '',
    postcode: '',
    country: '',
    countryName: '',
    status: 'PENDING_PAYMENT' as OrderStatus,
    paymentStatus: '',
    paymentProofReference: '',
    trackingNumber: '',
    shippingCarrier: '',
    courier: '',
    shippingMethodName: '',
  });

  const openEditModal = (order: Order) => {
    const address = order.shippingAddress || ({} as Order['shippingAddress']);
    setEditForm({
      customerName: order.customerName || '',
      customerEmail: order.customerEmail || '',
      phone: address.phone || '',
      institution: address.institution || '',
      department: address.department || '',
      addressLine1: address.addressLine1 || '',
      addressLine2: address.addressLine2 || '',
      city: address.city || '',
      county: address.county || '',
      postcode: address.postcode || '',
      country: address.country || '',
      countryName: address.countryName || '',
      status: order.status,
      paymentStatus: order.paymentStatus || '',
      paymentProofReference: order.paymentProofReference || '',
      trackingNumber: order.trackingNumber || '',
      shippingCarrier: order.shippingCarrier || '',
      courier: order.courier || '',
      shippingMethodName: order.shippingMethodName || '',
    });
    setSelectedOrder(order);
    setIsEditModalOpen(true);
  };

  const handleSaveEdits = async () => {
    if (!selectedOrder) return;
    if (!editForm.customerName.trim() || !editForm.customerEmail.includes('@')) {
      addToast('error', 'Invalid Details', 'Customer name and a valid email are required.');
      return;
    }
    if (!editForm.addressLine1.trim() || !editForm.city.trim() || !editForm.postcode.trim()) {
      addToast('error', 'Invalid Address', 'Address line 1, city, and postcode are required.');
      return;
    }
    setIsSavingEdit(true);
    const updated: Order = {
      ...selectedOrder,
      customerName: editForm.customerName.trim(),
      customerEmail: editForm.customerEmail.trim().toLowerCase(),
      status: editForm.status,
      paymentStatus: editForm.paymentStatus as Order['paymentStatus'],
      paymentProofReference: editForm.paymentProofReference.trim() || undefined,
      trackingNumber: editForm.trackingNumber.trim() || undefined,
      shippingCarrier: editForm.shippingCarrier.trim() || selectedOrder.shippingCarrier,
      courier: editForm.courier.trim() || undefined,
      shippingMethodName: editForm.shippingMethodName.trim() || selectedOrder.shippingMethodName,
      shippingAddress: {
        ...selectedOrder.shippingAddress,
        fullName: editForm.customerName.trim(),
        email: editForm.customerEmail.trim().toLowerCase(),
        phone: editForm.phone.trim(),
        institution: editForm.institution.trim() || undefined,
        department: editForm.department.trim() || undefined,
        addressLine1: editForm.addressLine1.trim(),
        addressLine2: editForm.addressLine2.trim() || undefined,
        city: editForm.city.trim(),
        county: editForm.county.trim() || undefined,
        postcode: editForm.postcode.trim(),
        country: editForm.country.trim() || selectedOrder.shippingAddress.country,
        countryName: editForm.countryName.trim() || selectedOrder.shippingAddress.countryName,
      },
    };
    const ok = await saveOrderEdits(updated);
    setIsSavingEdit(false);
    if (ok) {
      setSelectedOrder(updated);
      setIsEditModalOpen(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedOrder) return;
    setIsDeleting(true);
    const orderId = selectedOrder.id;
    const ok = await deleteOrder(orderId);
    setIsDeleting(false);
    if (ok) {
      setIsDeleteModalOpen(false);
      setSelectedOrder(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== 'ALL' && order.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = order.orderNumber.toLowerCase().includes(q);
      const matchCust = order.customerName.toLowerCase().includes(q);
      const matchEmail = (order.customerEmail || '').toLowerCase().includes(q);
      const matchTrack = order.trackingNumber?.toLowerCase().includes(q);
      if (!matchNum && !matchCust && !matchEmail && !matchTrack) return false;
    }
    return true;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="neutral" size="sm">Draft</Badge>;
      case 'PENDING_PAYMENT':
        return <Badge variant="warning" size="sm">Pending Payment</Badge>;
      case 'PAYMENT_SUBMITTED':
        return <Badge variant="gold" size="sm">Payment Submitted</Badge>;
      case 'PAYMENT_VERIFIED':
        return <Badge variant="success" size="sm">Payment Verified</Badge>;
      case 'PROCESSING':
        return <Badge variant="scientific" size="sm">Processing / Lab Prep</Badge>;
      case 'SHIPPED':
        return <Badge variant="scientific" size="sm">Dispatched</Badge>;
      case 'DELIVERED':
        return <Badge variant="success" size="sm">Delivered</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive" size="sm">Cancelled</Badge>;
      case 'REFUNDED':
        return <Badge variant="destructive" size="sm">Refunded</Badge>;
      case 'PAYMENT_EXPIRED':
        return <Badge variant="destructive" size="sm">Expired</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  const handleDispatchConfirm = () => {
    if (!selectedOrder) return;
    if (!trackingNumberInput.trim()) {
      addToast('error', 'Tracking Required', 'Please enter a valid courier tracking reference.');
      return;
    }

    const success = updateOrderStatus(selectedOrder.id, 'SHIPPED', {
      carrier: carrierInput,
      trackingNumber: trackingNumberInput.trim(),
      dispatchNotes: dispatchNotes.trim() || undefined,
    });

    if (success) {
      setIsDispatchModalOpen(false);
      setSelectedOrder(null);
      setTrackingNumberInput('');
      setDispatchNotes('');
    }
  };

  const handleCancelConfirm = () => {
    if (!selectedOrder) return;
    if (!cancelReason.trim()) {
      addToast('error', 'Reason Required', 'Please provide an audit justification for cancellation.');
      return;
    }

    const success = cancelOrder(selectedOrder.id, cancelReason.trim());
    if (success) {
      setIsCancelModalOpen(false);
      setSelectedOrder(null);
      setCancelReason('');
    }
  };

  const handleRefundConfirm = () => {
    if (!selectedOrder) return;
    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0 || amount > selectedOrder.total) {
      addToast('error', 'Invalid Amount', `Refund amount must be between £0.01 and £${selectedOrder.total.toFixed(2)}.`);
      return;
    }
    if (!refundReason.trim()) {
      addToast('error', 'Reason Required', 'Please enter a reason for the refund.');
      return;
    }

    const success = processRefund(selectedOrder.id, amount, refundReason.trim());
    if (success) {
      setIsRefundModalOpen(false);
      setSelectedOrder(null);
      setRefundAmount('');
      setRefundReason('');
    }
  };

  const handleOverrideConfirm = () => {
    if (!selectedOrder) return;
    if (!overrideJustification.trim()) {
      addToast('error', 'Justification Required', 'Mandatory GxP administrative justification required for manual state override.');
      return;
    }

    const success = updateOrderStatus(selectedOrder.id, overrideTargetStatus, {
      overrideStateTransition: true,
      overrideJustification: overrideJustification.trim(),
      note: `ADMIN OVERRIDE: Forced transition to ${overrideTargetStatus}. Justification: ${overrideJustification.trim()}`,
    });

    if (success) {
      setIsOverrideModalOpen(false);
      setSelectedOrder(null);
      setOverrideJustification('');
    }
  };

  const associatedPayment = selectedOrder
    ? payments.find((p) => p.orderId === selectedOrder.id || p.id === selectedOrder.paymentId)
    : null;

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'].map(
            (statusKey) => (
              <button
                key={statusKey}
                onClick={() => setStatusFilter(statusKey)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  statusFilter === statusKey
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                }`}
              >
                {statusKey.replace('_', ' ')}
                {statusKey === 'ALL'
                  ? ` (${orders.length})`
                  : ` (${orders.filter((o) => o.status === statusKey).length})`}
              </button>
            )
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search order #, customer, tracking..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-8"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3">Order Number</th>
                <th className="p-3">Date</th>
                <th className="p-3">Customer & Facility</th>
                <th className="p-3">Line Items</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3">Courier / Tracking</th>
                <th className="p-3 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 font-sans">
                    No orders found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-950 font-mono">
                      {ord.orderNumber}
                    </td>
                    <td className="p-3 text-slate-500 text-[10px]">
                      {formatDate(ord.createdAt)}
                    </td>
                    <td className="p-3 font-sans">
                      <span className="font-bold block text-slate-900">{ord.customerName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{ord.customerEmail}</span>
                    </td>
                    <td className="p-3 text-slate-700">
                      {ord.items.length} line item(s)
                      <span className="block text-[10px] text-slate-400">
                        {ord.items.map((i) => `${i.quantity}x ${i.variantName}`).join(', ').slice(0, 32)}...
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-950 font-mono">
                      {formatPrice(ord.total, ord.currency || currency)}
                    </td>
                    <td className="p-3">{getStatusBadge(ord.status)}</td>
                    <td className="p-3">
                      {ord.trackingNumber ? (
                        <div>
                          <span className="font-mono text-slate-800 font-bold block text-[11px]">
                            {ord.trackingNumber}
                          </span>
                          <span className="text-[10px] text-slate-500 font-sans">
                            {ord.shippingCarrier || 'Royal Mail Tracked 24'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(ord)}
                          className="text-[10px] h-7 px-2"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Inspect & Manage
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(ord)}
                          className="text-[10px] h-7 px-2"
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(ord);
                            setIsDeleteModalOpen(true);
                          }}
                          className="text-[10px] h-7 px-2 text-rose-700 border-rose-200 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>

                        {(ord.status === 'PAYMENT_VERIFIED' || ord.status === 'PROCESSING') && (
                          <Button
                            variant="gold"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(ord);
                              setCarrierInput(ord.shippingCarrier || 'Royal Mail Tracked 24');
                              setIsDispatchModalOpen(true);
                            }}
                            className="text-[10px] h-7 px-2 bg-amber-600 hover:bg-amber-700 text-white"
                          >
                            <Truck className="h-3 w-3 mr-1" />
                            Dispatch
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Order Detail & Operations Modal */}
      {selectedOrder &&
        !isDispatchModalOpen &&
        !isCancelModalOpen &&
        !isRefundModalOpen &&
        !isOverrideModalOpen &&
        !isEditModalOpen &&
        !isDeleteModalOpen && (
        <Modal
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          title={`Order Operations: Order #${selectedOrder.orderNumber}`}
          maxWidth="2xl"
        >
          <div className="space-y-6 text-xs font-mono max-h-[80vh] overflow-y-auto pr-1">
            {/* Top Status & Quick Transition Bar */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Current Order Status</span>
                <div className="mt-1 flex items-center gap-2">
                  {getStatusBadge(selectedOrder.status)}
                  <span className="text-[11px] text-slate-500 font-sans">
                    Created {formatDate(selectedOrder.createdAt)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(selectedOrder.status === 'PAYMENT_VERIFIED' || selectedOrder.status === 'PROCESSING') && (
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => {
                      setCarrierInput(selectedOrder.shippingCarrier || 'Royal Mail Tracked 24');
                      setIsDispatchModalOpen(true);
                    }}
                    className="text-xs font-mono h-8 bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Truck className="h-3.5 w-3.5 mr-1" />
                    Dispatch Order
                  </Button>
                )}

                {selectedOrder.status === 'SHIPPED' && (
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'DELIVERED', {
                        note: 'Marked delivered by administrator following courier delivery scan confirmation.',
                      });
                      addToast('success', 'Order Delivered', `Order #${selectedOrder.orderNumber} marked delivered.`);
                    }}
                    className="text-xs font-mono h-8 bg-emerald-700 hover:bg-emerald-800 text-white"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Confirm Delivered
                  </Button>
                )}

                {selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'REFUNDED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCancelModalOpen(true)}
                    className="text-xs font-mono h-8 text-rose-700 hover:bg-rose-50 border-rose-200"
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Cancel Order
                  </Button>
                )}

                {(selectedOrder.status === 'PAYMENT_VERIFIED' ||
                  selectedOrder.status === 'PROCESSING' ||
                  selectedOrder.status === 'SHIPPED' ||
                  selectedOrder.status === 'DELIVERED') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRefundAmount(selectedOrder.total.toString());
                      setIsRefundModalOpen(true);
                    }}
                    className="text-xs font-mono h-8 text-amber-800 hover:bg-amber-50 border-amber-200"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Process Refund
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(selectedOrder)}
                  className="text-xs font-mono h-8"
                >
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Edit Details
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="text-xs font-mono h-8 text-rose-700 hover:bg-rose-50 border-rose-200"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOverrideModalOpen(true)}
                  className="text-[10px] font-mono h-8 text-slate-600 hover:bg-stone-100"
                >
                  Override State
                </Button>
              </div>
            </div>

            {/* Commercial & Financial Breakdown */}
            <div className="space-y-3">
              <h4 className="font-bold uppercase text-slate-900 text-xs border-b border-stone-100 pb-1">
                Commercial Line Items & Discounts
              </h4>
              <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden bg-white">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{item.productName}</span>
                      <span className="text-[10px] text-slate-500">
                        {item.quantity}x {item.variantName} ({item.sku}) • Base: £{item.unitPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-950 block">
                        {formatPrice(item.totalPrice, selectedOrder.currency || currency)}
                      </span>
                      {item.tierDiscountAmount > 0 && (
                        <span className="text-[10px] text-emerald-700 block">
                          Tier Discount: -£{item.tierDiscountAmount.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                <div className="p-3 bg-stone-50/80 space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>{formatPrice(selectedOrder.subtotal, selectedOrder.currency || currency)}</span>
                  </div>
                  {selectedOrder.tierDiscountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Volume Tier Discount:</span>
                      <span>-£{selectedOrder.tierDiscountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedOrder.couponDiscountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Voucher Discount ({selectedOrder.couponCode}):</span>
                      <span>-£{selectedOrder.couponDiscountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedOrder.cryptoDiscountAmount > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>Cryptocurrency Discount (5%):</span>
                      <span>-£{selectedOrder.cryptoDiscountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Shipping ({selectedOrder.shippingMethodName || selectedOrder.shippingCarrier}):</span>
                    <span>{selectedOrder.shippingFee === 0 ? 'FREE' : formatPrice(selectedOrder.shippingFee, selectedOrder.currency || currency)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-950 text-xs pt-1 border-t border-stone-200">
                    <span>Total Authoritative Settlement:</span>
                    <span>{formatPrice(selectedOrder.total, selectedOrder.currency || currency)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dispatch & Address Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">
                  Laboratory Dispatch Address
                </span>
                <span className="font-bold text-slate-900 block">{selectedOrder.shippingAddress.fullName}</span>
                {selectedOrder.shippingAddress.institution && (
                  <span className="text-amber-800 text-[11px] block">{selectedOrder.shippingAddress.institution}</span>
                )}
                <span className="text-slate-600 block">{selectedOrder.shippingAddress.addressLine1}</span>
                {selectedOrder.shippingAddress.addressLine2 && (
                  <span className="text-slate-600 block">{selectedOrder.shippingAddress.addressLine2}</span>
                )}
                <span className="text-slate-600 block">
                  {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postcode}
                </span>
                <span className="text-slate-600 block">
                  {selectedOrder.shippingAddress.countryName || selectedOrder.shippingAddress.country}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">
                  Settlement & Payment Coordinates
                </span>
                <div>Method: <strong className="text-slate-900">{selectedOrder.paymentMethod.replace('_', ' ')}</strong></div>
                <div>Status: <strong className="text-slate-900">{selectedOrder.paymentStatus}</strong></div>
                <div>Proof Ref: <strong className="text-amber-900">{selectedOrder.paymentProofReference || 'None'}</strong></div>
                {selectedOrder.reservationExpiresAt && (
                  <div className="text-[10px] text-slate-500 pt-1">
                    Inventory Reservation Expiry: {formatDate(selectedOrder.reservationExpiresAt)}
                  </div>
                )}
              </div>
            </div>

            {/* Audit History Timeline */}
            <div className="space-y-2">
              <h4 className="font-bold uppercase text-slate-900 text-xs flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-amber-700" />
                <span>Authoritative State Machine & Audit History ({selectedOrder.history?.length || 0} Events)</span>
              </h4>
              <div className="space-y-2 border border-stone-200 rounded-xl p-3 bg-stone-50">
                {selectedOrder.history && selectedOrder.history.length > 0 ? (
                  selectedOrder.history.map((event, idx) => (
                    <div key={event.id || idx} className="text-[11px] flex items-start gap-2 bg-white p-2.5 rounded-lg border border-stone-200">
                      <div className="h-2 w-2 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            {event.fromStatus ? `${event.fromStatus} → ${event.toStatus}` : event.toStatus}
                          </span>
                          <span className="text-[10px] text-slate-400">{formatDate(event.timestamp)}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Actor: <strong className="text-slate-700">{event.actor}</strong> ({event.actorRole})
                        </div>
                        {event.note && (
                          <div className="text-slate-600 text-xs italic mt-0.5">
                            &ldquo;{event.note}&rdquo;
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 text-center py-2">No history entries recorded.</div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-stone-200">
              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Dispatch Modal */}
      {isDispatchModalOpen && selectedOrder && (
        <Modal
          isOpen={isDispatchModalOpen}
          onClose={() => setIsDispatchModalOpen(false)}
          title={`Cold Dispatch Order #${selectedOrder.orderNumber}`}
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1">
              <div className="font-bold text-slate-900">{selectedOrder.customerName}</div>
              <div className="text-slate-600">
                {selectedOrder.shippingAddress.addressLine1}, {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postcode}
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-900 block mb-1">Carrier / Dispatch Service</label>
              <select
                value={carrierInput}
                onChange={(e) => setCarrierInput(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-md p-2"
              >
                <option value="Royal Mail Tracked 24">Royal Mail Tracked 24 (Next-Day Insulated)</option>
                <option value="DPD Air Classic">DPD Air Classic (Europe Zone 1)</option>
                <option value="DHL Express ColdChain">DHL Express ColdChain (International Standard)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-900 block mb-1">Courier Tracking Code *</label>
              <Input
                required
                placeholder="e.g. GB-RM-2026-902144"
                value={trackingNumberInput}
                onChange={(e) => setTrackingNumberInput(e.target.value)}
              />
            </div>

            <div>
              <label className="font-bold text-slate-900 block mb-1">Dispatch Packaging Notes (Optional)</label>
              <Input
                placeholder="e.g. Packed in desiccant foil with dry ice pack."
                value={dispatchNotes}
                onChange={(e) => setDispatchNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <Button variant="outline" onClick={() => setIsDispatchModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="gold" onClick={handleDispatchConfirm} className="bg-amber-600 hover:bg-amber-700 text-white">
                Confirm Cold Dispatch
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancellation Modal */}
      {isCancelModalOpen && selectedOrder && (
        <Modal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          title={`Cancel Order #${selectedOrder.orderNumber}`}
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-rose-950 font-sans">
              <p className="font-bold">Inventory Auto-Release Notice</p>
              <p className="text-xs text-rose-800 mt-1">
                Cancelling this order will release all reserved inventory items ({selectedOrder.items.length} SKUs) back to available stock.
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-900 block mb-1">
                Audit Justification for Cancellation *
              </label>
              <Input
                required
                placeholder="e.g. Customer requested cancellation prior to lab packaging"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <Button variant="outline" onClick={() => setIsCancelModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="gold" onClick={handleCancelConfirm} className="bg-rose-700 hover:bg-rose-800 text-white">
                Cancel Order
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Refund Modal */}
      {isRefundModalOpen && selectedOrder && (
        <Modal
          isOpen={isRefundModalOpen}
          onClose={() => setIsRefundModalOpen(false)}
          title={`Process Refund: Order #${selectedOrder.orderNumber}`}
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-950 font-sans">
              <p className="font-bold">Financial Settlement Refund</p>
              <p className="text-xs text-amber-800 mt-1">
                Order Total: £{selectedOrder.total.toFixed(2)}. Enter the amount to credit back to customer.
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-900 block mb-1">Refund Amount (£) *</label>
              <Input
                type="number"
                step="0.01"
                required
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
              />
            </div>

            <div>
              <label className="font-bold text-slate-900 block mb-1">Refund Justification *</label>
              <Input
                required
                placeholder="e.g. Laboratory batch delivery rescheduled / customer credit"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <Button variant="outline" onClick={() => setIsRefundModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="gold" onClick={handleRefundConfirm} className="bg-amber-700 hover:bg-amber-800 text-white">
                Confirm Refund
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Manual State Override Modal */}
      {isOverrideModalOpen && selectedOrder && (
        <Modal
          isOpen={isOverrideModalOpen}
          onClose={() => setIsOverrideModalOpen(false)}
          title={`Manual State Override: Order #${selectedOrder.orderNumber}`}
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 bg-stone-100 rounded-lg border border-stone-300 text-slate-900 font-sans">
              <p className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                GxP Administrative State Machine Override
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Emergency override bypasses standard linear validation guards. A permanent audit log with your operator ID and mandatory justification will be recorded.
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-900 block mb-1">Target Order Status</label>
              <select
                value={overrideTargetStatus}
                onChange={(e) => setOverrideTargetStatus(e.target.value as OrderStatus)}
                className="w-full bg-stone-50 border border-stone-300 rounded-md p-2 text-xs"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                <option value="PAYMENT_SUBMITTED">PAYMENT_SUBMITTED</option>
                <option value="PAYMENT_VERIFIED">PAYMENT_VERIFIED</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="REFUNDED">REFUNDED</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-900 block mb-1">
                Mandatory Administrative Justification *
              </label>
              <Input
                required
                placeholder="e.g. Authorized emergency correction by Lead QA Officer"
                value={overrideJustification}
                onChange={(e) => setOverrideJustification(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <Button variant="outline" onClick={() => setIsOverrideModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="gold" onClick={handleOverrideConfirm} className="bg-slate-900 text-amber-400">
                Apply Override
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Order Modal */}
      {isEditModalOpen && selectedOrder && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Order #${selectedOrder.orderNumber}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs font-mono max-h-[80vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-900 block mb-1">Customer name *</label>
                <Input
                  value={editForm.customerName}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, customerName: e.target.value }))}
                />
              </div>
              <div>
                <label className="font-bold text-slate-900 block mb-1">Customer email *</label>
                <Input
                  type="email"
                  value={editForm.customerEmail}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, customerEmail: e.target.value }))}
                />
              </div>
              <div>
                <label className="font-bold text-slate-900 block mb-1">Phone</label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="font-bold text-slate-900 block mb-1">Institution</label>
                <Input
                  value={editForm.institution}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, institution: e.target.value }))}
                />
              </div>
              <div>
                <label className="font-bold text-slate-900 block mb-1">Department</label>
                <Input
                  value={editForm.department}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, department: e.target.value }))}
                />
              </div>
              <div>
                <label className="font-bold text-slate-900 block mb-1">Order status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value as OrderStatus }))}
                  className="w-full bg-stone-50 border border-stone-300 rounded-md p-2 text-xs"
                >
                  <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                  <option value="PAYMENT_SUBMITTED">PAYMENT_SUBMITTED</option>
                  <option value="PAYMENT_VERIFIED">PAYMENT_VERIFIED</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="REFUNDED">REFUNDED</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-900 block mb-1">Address line 1 *</label>
                <Input
                  value={editForm.addressLine1}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, addressLine1: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-900 block mb-1">Address line 2</label>
                <Input
                  value={editForm.addressLine2}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, addressLine2: e.target.value }))}
                />
              </div>
              <div>
                <label className="font-bold text-slate-900 block mb-1">City *</label>
                <Input
                  value={editForm.city}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, city: e.target.value }))}
                />
              </div>
              <div>
                <label className="font-bold text-slate-900 block mb-1">County</label>
                <Input
                  value={editForm.county}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, county: e.target.value }))}
                />
              </div>
              <div>
                <label className="font-bold text-slate-900 block mb-1">Postcode *</label>
                <Input
                  value={editForm.postcode}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, postcode: e.target.value }))}
                />
              </div>
              <div>
                <label className="font-bold text-slate-900 block mb-1">Country</label>
                <Input
                  value={editForm.countryName || editForm.country}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, countryName: e.target.value, country: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="font-bold text-slate-900 block mb-1">Payment status</label>
                <Input
                  value={editForm.paymentStatus}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, paymentStatus: e.target.value }))}
                />
              </div>
              <div>
                <label className="font-bold text-slate-900 block mb-1">Payment proof reference</label>
                <Input
                  value={editForm.paymentProofReference}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, paymentProofReference: e.target.value }))}
                />
              </div>
              <div>
                <label className="font-bold text-slate-900 block mb-1">Tracking number</label>
                <Input
                  value={editForm.trackingNumber}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, trackingNumber: e.target.value }))}
                />
              </div>
              <div>
                <label className="font-bold text-slate-900 block mb-1">Carrier</label>
                <Input
                  value={editForm.shippingCarrier}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, shippingCarrier: e.target.value }))}
                />
              </div>
              <div>
                <label className="font-bold text-slate-900 block mb-1">Courier</label>
                <Input
                  value={editForm.courier}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, courier: e.target.value }))}
                />
              </div>
              <div>
                <label className="font-bold text-slate-900 block mb-1">Shipping method</label>
                <Input
                  value={editForm.shippingMethodName}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, shippingMethodName: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSavingEdit}>
                Cancel
              </Button>
              <Button
                variant="gold"
                onClick={() => void handleSaveEdits()}
                disabled={isSavingEdit}
                className="bg-slate-900 text-amber-300"
              >
                {isSavingEdit ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Order Modal */}
      {isDeleteModalOpen && selectedOrder && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title={`Delete Order #${selectedOrder.orderNumber}`}
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-rose-950 font-sans">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                Permanent deletion
              </p>
              <p className="text-xs text-rose-800 mt-1">
                This removes order #{selectedOrder.orderNumber} for {selectedOrder.customerName}, including payment
                records and inventory events linked to it. This cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>
                Keep Order
              </Button>
              <Button
                variant="gold"
                onClick={() => void handleDeleteConfirm()}
                disabled={isDeleting}
                className="bg-rose-700 hover:bg-rose-800 text-white"
              >
                {isDeleting ? 'Deleting…' : 'Delete Permanently'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
