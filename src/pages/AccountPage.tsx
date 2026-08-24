import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ProductCard } from '../components/ui/ProductCard';
import { formatPrice, formatDate } from '../lib/utils';
import { Order } from '../types';
import {
  User,
  Building2,
  Package,
  Heart,
  FileCheck2,
  ExternalLink,
  ShieldCheck,
  Clock,
  Truck,
  CheckCircle2,
} from 'lucide-react';

export const AccountPage: React.FC = () => {
  const {
    currentUser,
    orders,
    wishlist,
    products,
    currency,
    navigate,
    signOutCustomer,
    isAdminAuthenticated,
    signOutAdmin,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'wishlist' | 'compliance'>('orders');
  const [inspectedOrder, setInspectedOrder] = useState<Order | null>(null);

  // Filter orders for this customer
  const customerOrders = orders.filter(
    (o) => o.customerEmail.toLowerCase() === currentUser.email.toLowerCase() || o.customerId === currentUser.id
  );

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="neutral" size="sm">Draft</Badge>;
      case 'PENDING_PAYMENT':
        return <Badge variant="warning" size="sm">Pending Payment</Badge>;
      case 'PAYMENT_SUBMITTED':
        return <Badge variant="brand" size="sm">Payment Submitted</Badge>;
      case 'PAYMENT_VERIFIED':
        return <Badge variant="success" size="sm">Payment Verified</Badge>;
      case 'PROCESSING':
        return <Badge variant="brand" size="sm">Laboratory Prep</Badge>;
      case 'SHIPPED':
        return <Badge variant="brand" size="sm">Dispatched</Badge>;
      case 'DELIVERED':
        return <Badge variant="success" size="sm">Delivered</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive" size="sm">Cancelled</Badge>;
      case 'REFUNDED':
        return <Badge variant="destructive" size="sm">Refunded</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Customer Account & Requisitions' }]} />

      {/* Account Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-[#4353FF] text-white flex items-center justify-center font-mono text-xl font-bold border border-blue-400 shrink-0 shadow-md shadow-blue-500/20">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono text-slate-950">{currentUser.name}</h1>
              <Badge variant="brand" size="sm">
                {currentUser.role}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{currentUser.email}</p>
            {currentUser.institution && (
              <p className="text-xs text-[#4353FF] font-medium flex items-center gap-1 mt-1 font-mono">
                <Building2 className="h-3.5 w-3.5" />
                {currentUser.institution}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right text-xs font-mono text-slate-500 hidden sm:block">
            <span>Customer ID: {currentUser.id}</span>
            <div className="text-emerald-700 font-semibold flex items-center justify-end gap-1">
              <ShieldCheck className="h-3 w-3" />
              Signed in
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="font-mono text-xs"
            onClick={async () => {
              if (isAdminAuthenticated && currentUser.role === 'ADMIN') {
                await signOutAdmin();
              } else {
                await signOutCustomer();
              }
              navigate('/account/login', { replace: true });
            }}
          >
            Sign out
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'orders'
              ? 'border-[#4353FF] text-[#4353FF] bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Requisition History ({customerOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('wishlist')}
          className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'wishlist'
              ? 'border-[#4353FF] text-[#4353FF] bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Saved Compounds ({wishlistedProducts.length})
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'profile'
              ? 'border-[#4353FF] text-[#4353FF] bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Facility Profile
        </button>
      </div>

      {/* Tab 1: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-12 text-[11px] font-bold uppercase font-mono text-slate-700">
              <div className="col-span-3">Order Number</div>
              <div className="col-span-3">Date &amp; Method</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Total</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            <div className="divide-y divide-slate-100 font-mono text-xs">
              {customerOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-sans">
                  No requisitions yet for this account.
                </div>
              ) : (
                customerOrders.map((ord) => (
                <div key={ord.id} className="p-4 grid grid-cols-12 items-center gap-2">
                  <div className="col-span-3">
                    <span className="font-bold text-slate-900 block">{ord.orderNumber}</span>
                    <span className="text-[10px] text-slate-500">
                      {ord.items.length} Compound{ord.items.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="col-span-3 space-y-0.5">
                    <span className="text-slate-800 block">{formatDate(ord.createdAt)}</span>
                    <span className="text-[10px] text-slate-500">
                      {ord.paymentMethod === 'BANK_TRANSFER' ? 'UK Faster Payments' : 'Cryptocurrency (-5%)'}
                    </span>
                  </div>

                  <div className="col-span-2">{getStatusBadge(ord.status)}</div>

                  <div className="col-span-2 text-right font-bold text-slate-900">
                    {formatPrice(ord.total, currency)}
                  </div>

                  <div className="col-span-2 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInspectedOrder(ord)}
                      className="text-xs font-mono h-8"
                    >
                      Inspect
                    </Button>
                  </div>
                </div>
              ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Wishlist */}
      {activeTab === 'wishlist' && (
        <div>
          {wishlistedProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-xs text-slate-500 font-mono">
              No saved compounds in your list. Click the heart icon on any product to save it.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Facility Profile */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4 text-xs font-mono">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100">
            Institutional Laboratory Credentials
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-500 block text-[10px]">Contact Person:</span>
              <span className="font-bold text-slate-900">{currentUser.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Email Address:</span>
              <span className="font-bold text-slate-900">{currentUser.email}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Institution:</span>
              <span className="font-bold text-slate-900">{currentUser.institution || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Telephone:</span>
              <span className="font-bold text-slate-900">{currentUser.phone || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Order Inspection Modal */}
      {inspectedOrder && (
        <Modal
          isOpen={true}
          onClose={() => setInspectedOrder(null)}
          title={`Requisition Details — #${inspectedOrder.orderNumber}`}
          size="lg"
        >
          <div className="space-y-6 font-mono text-xs">
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="text-slate-500 block text-[10px]">Status:</span>
                <div>{getStatusBadge(inspectedOrder.status)}</div>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px]">Order Date:</span>
                <span className="font-bold">{formatDate(inspectedOrder.createdAt)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold uppercase text-slate-900 block">Compounds Ordered:</span>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl p-3 bg-white">
                {inspectedOrder.items.map((it) => (
                  <div key={it.id} className="py-2 first:pt-0 last:pb-0 flex justify-between items-center">
                    <div>
                      <span className="font-bold block">{it.productName}</span>
                      <span className="text-slate-500 text-[10px]">
                        {it.size} • Qty: {it.quantity} • SKU: {it.sku}
                      </span>
                    </div>
                    <span className="font-bold">{formatPrice(it.unitPrice * it.quantity, currency)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <span className="font-bold text-slate-900 text-sm">Total Requisition:</span>
              <span className="font-black text-base text-[#4353FF]">{formatPrice(inspectedOrder.total, currency)}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
