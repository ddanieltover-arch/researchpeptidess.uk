import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { RadioGroup } from '../components/ui/Radio';
import { Checkbox } from '../components/ui/Checkbox';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { Badge } from '../components/ui/Badge';
import { formatPrice } from '../lib/utils';
import { PaymentMethod, ShippingAddress, Order } from '../types';
import {
  Building2,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Copy,
  Check,
  AlertTriangle,
  FileCheck2,
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const {
    cart,
    cartTotals,
    currency,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    createOrder,
    navigate,
    currentUser,
    addToast,
  } = useStore();

  const [step, setStep] = useState<'details' | 'confirmation'>('details');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  // Form Fields
  const [email, setEmail] = useState(currentUser.email || '');
  const [fullName, setFullName] = useState(currentUser.name || '');
  const [institution, setInstitution] = useState(currentUser.institution || '');
  const [addressLine1, setAddressLine1] = useState('Laboratory Block 4, Research Core');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('Oxford');
  const [county, setCounty] = useState('Oxfordshire');
  const [postcode, setPostcode] = useState('OX1 3QU');
  const [country, setCountry] = useState('GB');
  const [phone, setPhone] = useState(currentUser.phone || '+44 7700 900123');

  // Payment proof
  const [bankRefInput, setBankRefInput] = useState('');
  const [cryptoTxInput, setCryptoTxInput] = useState('');

  // Compliance acknowledgments
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [researchUseAgreed, setResearchUseAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [copiedBank, setCopiedBank] = useState(false);
  const [copiedCrypto, setCopiedCrypto] = useState(false);

  if (cart.length === 0 && step !== 'confirmation') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold font-mono text-slate-900">Your basket is empty</h2>
        <p className="text-xs text-slate-500">Add compounds before proceeding to checkout.</p>
        <Button variant="primary" size="md" onClick={() => navigate('/shop')} className="shadow-md shadow-blue-500/20">
          Browse Requisition Catalogue
        </Button>
      </div>
    );
  }

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAgreed || !researchUseAgreed) {
      addToast('error', 'Compliance Required', 'Please accept the Research-Use and In-Vitro Terms.');
      return;
    }

    setIsSubmitting(true);

    const shippingAddress: ShippingAddress = {
      fullName,
      institution,
      addressLine1,
      addressLine2,
      city,
      county,
      postcode,
      country,
      countryName: country === 'GB' ? 'United Kingdom' : country,
      phone,
      email,
    };

    const paymentProof =
      selectedPaymentMethod === 'BANK_TRANSFER'
        ? bankRefInput || 'FPS-TRANSFER-PENDING'
        : cryptoTxInput || 'CRYPTO-TX-PENDING';

    setTimeout(() => {
      void (async () => {
        const order = await createOrder({
          customerEmail: email,
          customerName: fullName,
          shippingAddress,
          paymentMethod: selectedPaymentMethod,
          paymentProofReference: paymentProof,
        });

        setCreatedOrder(order);
        setStep('confirmation');
        setIsSubmitting(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })();
    }, 700);
  };

  const copyToClipboard = (text: string, type: 'bank' | 'crypto') => {
    navigator.clipboard?.writeText(text);
    if (type === 'bank') {
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2000);
    } else {
      setCopiedCrypto(true);
      setTimeout(() => setCopiedCrypto(false), 2000);
    }
    addToast('info', 'Copied to Clipboard', text);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Basket', onClick: () => navigate('/cart') },
          { label: step === 'confirmation' ? 'Order Confirmed' : 'Requisition Checkout' },
        ]}
      />

      {step === 'details' ? (
        <form onSubmit={handlePlaceOrder} className="space-y-8">
          <div className="border-b border-slate-200 pb-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#4353FF]">
              Institutional Dispatch &amp; Settlement
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-950 tracking-tight mt-0.5">
              Requisition Checkout
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Columns: Address & Payment Details */}
            <div className="lg:col-span-8 space-y-8">
              {/* Section 1: Institutional & Contact Details */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-slate-900">
                    1. Requisitioner &amp; Facility Details
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">Guest / Account Checkout</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Contact Investigator / Full Name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Alistair Harrison"
                  />
                  <Input
                    label="Academic / Institutional Email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="investigator@institution.ac.uk"
                  />
                  <Input
                    label="Institution / Department / Company"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. Dept of Biochemistry / Laboratory Core"
                    className="sm:col-span-2"
                  />
                  <Input
                    label="Facility Phone / Direct Line"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+44 7700 900000"
                    className="sm:col-span-2"
                  />
                </div>
              </div>

              {/* Section 2: Laboratory Shipping Destination */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-slate-900 pb-3 border-b border-slate-100">
                  2. Laboratory Dispatch Destination
                </h3>

                <div className="space-y-4">
                  <Input
                    label="Address Line 1"
                    required
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="e.g. Science Park Block C, Laboratory 204"
                  />
                  <Input
                    label="Address Line 2 (Optional)"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="e.g. Suite, Floor, Facility Code"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label="Town / City"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Oxford"
                    />
                    <Input
                      label="County / Region"
                      value={county}
                      onChange={(e) => setCounty(e.target.value)}
                      placeholder="e.g. Oxfordshire"
                    />
                    <Input
                      label="Postal Code / Eircode"
                      required
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value)}
                      placeholder="e.g. OX1 3QU"
                      mono
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 font-mono">
                      Destination Country
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[#4353FF] focus:ring-1 focus:ring-[#4353FF] font-mono"
                    >
                      <option value="GB">United Kingdom (Tracked 24 / Guaranteed Next-Day)</option>
                      <option value="IE">Ireland (DHL Express International)</option>
                      <option value="DE">Germany (EU Priority Tracked)</option>
                      <option value="FR">France (EU Priority Tracked)</option>
                      <option value="NL">Netherlands (EU Priority Tracked)</option>
                      <option value="SE">Sweden (EU Priority Tracked)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Payment Method Architecture */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-slate-900">
                    3. Payment &amp; Settlement Selection
                  </h3>
                  <Badge variant="brand" size="sm">
                    Manual Verified Settlement
                  </Badge>
                </div>

                <RadioGroup
                  name="paymentMethod"
                  value={selectedPaymentMethod}
                  onChange={(val) => setSelectedPaymentMethod(val as PaymentMethod)}
                  options={[
                    {
                      value: 'BANK_TRANSFER',
                      title: 'UK Faster Payments / SEPA Bank Transfer',
                      description:
                        'Direct institutional bank transfer via UK Faster Payments or SEPA. Verified manually by our laboratory compliance team upon receipt.',
                      icon: <Building2 className="h-5 w-5 text-[#4353FF]" />,
                    },
                    {
                      value: 'CRYPTOCURRENCY',
                      title: 'Cryptocurrency (Bitcoin / Ethereum / USDT-TRC20)',
                      description:
                        'Instant settlement with an automatic 5% institutional discount applied to the total.',
                      badge: '5% DISCOUNT APPLIED',
                      icon: <Coins className="h-5 w-5 text-sky-500" />,
                    },
                  ]}
                />

                {/* Conditional Payment Instructions Preview */}
                {selectedPaymentMethod === 'BANK_TRANSFER' ? (
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>UK Bank Account Details</span>
                      <span className="text-[10px] text-[#4353FF] bg-blue-50 px-2 py-0.5 rounded-md font-bold">
                        Manual Verification
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 block">Bank Name:</span>
                        <span className="font-bold text-slate-800">Barclays Corporate UK</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Account Name:</span>
                        <span className="font-bold text-slate-800">Research Peptides UK Ltd</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Sort Code:</span>
                        <span className="font-bold text-slate-800">20-00-00</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Account Number:</span>
                        <span className="font-bold text-slate-800">89210044</span>
                      </div>
                    </div>

                    <Input
                      label="Payment Reference Note / FPS Transaction Ref"
                      value={bankRefInput}
                      onChange={(e) => setBankRefInput(e.target.value)}
                      placeholder="e.g. FPS-OXFORD-LAB or your Requisition PO Number"
                      className="text-xs h-9"
                      helperText="You can also enter your institutional PO number or FPS reference."
                    />
                  </div>
                ) : (
                  <div className="rounded-xl bg-blue-50/70 border border-blue-200 p-4 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between font-bold text-blue-950">
                      <span>Cryptocurrency Settlement Addresses</span>
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">
                        -5% Savings Applied
                      </span>
                    </div>

                    <div className="space-y-2 text-[11px]">
                      <div className="bg-white p-2.5 rounded-lg border border-blue-200 flex items-center justify-between">
                        <div className="truncate pr-2">
                          <span className="text-slate-500 block text-[10px]">Bitcoin (BTC):</span>
                          <span className="font-bold text-slate-900 text-xs">
                            bc1qrpuklab99purepeptidesresearch78x221
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              'bc1qrpuklab99purepeptidesresearch78x221',
                              'crypto'
                            )
                          }
                          className="text-slate-500 hover:text-slate-900 p-1"
                        >
                          {copiedCrypto ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-blue-200 flex items-center justify-between">
                        <div className="truncate pr-2">
                          <span className="text-slate-500 block text-[10px]">USDT (TRC-20):</span>
                          <span className="font-bold text-slate-900 text-xs">
                            TRPUK99PureBritishPeptidesTRC20OfficialX
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              'TRPUK99PureBritishPeptidesTRC20OfficialX',
                              'crypto'
                            )
                          }
                          className="text-slate-500 hover:text-slate-900 p-1"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <Input
                      label="Transaction Hash / TXID (Optional at this stage)"
                      value={cryptoTxInput}
                      onChange={(e) => setCryptoTxInput(e.target.value)}
                      placeholder="Paste TXID hash if payment already broadcasted"
                      className="text-xs h-9"
                    />
                  </div>
                )}
              </div>

              {/* Section 4: Mandatory Compliance Declarations */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-6 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold uppercase font-mono tracking-wider text-[#4353FF]">
                  <ShieldCheck className="h-5 w-5 text-[#4353FF]" />
                  <span>4. Statutory Research &amp; Legal Agreement</span>
                </div>

                <div className="space-y-3">
                  <Checkbox
                    checked={researchUseAgreed}
                    onChange={(e) => setResearchUseAgreed(e.target.checked)}
                    required
                    label={<span className="font-bold text-slate-900 text-xs font-mono">I confirm In-Vitro Laboratory Research Use Only</span>}
                    description="I legally affirm that all compounds in this order are strictly for laboratory experimentation, assays, and in-vitro research. They will NOT be administered to humans or animals."
                  />

                  <Checkbox
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    required
                    label={<span className="font-bold text-slate-900 text-xs font-mono">I agree to Terms of Supply &amp; Verification Protocol</span>}
                    description="I acknowledge that orders are dispatched once manual bank or crypto confirmation is recorded by Research Peptides UK."
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Authoritative Order Summary */}
            <div className="lg:col-span-4 space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5 sticky top-24">
                <h3 className="text-base font-bold font-mono text-slate-950 pb-3 border-b border-slate-100">
                  Authoritative Breakdown
                </h3>

                {/* Mini Item List */}
                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto space-y-2 pr-1">
                  {cart.map((item) => (
                    <div key={item.variantId} className="pt-2 first:pt-0 flex justify-between items-start text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block truncate max-w-[180px] font-mono">
                          {item.productName}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {item.quantity}x {item.size}
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-slate-900">
                        {formatPrice(item.unitPrice * item.quantity, currency)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Calculation Totals */}
                <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatPrice(cartTotals.subtotal, currency)}</span>
                  </div>

                  {cartTotals.itemDiscounts > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Volume Tier Savings</span>
                      <span className="font-mono">-{formatPrice(cartTotals.itemDiscounts, currency)}</span>
                    </div>
                  )}

                  {selectedPaymentMethod === 'CRYPTOCURRENCY' && cartTotals.cryptoDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Crypto Discount (5%)</span>
                      <span className="font-mono">-{formatPrice(cartTotals.cryptoDiscount, currency)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span>Tracked Shipping</span>
                    <span className="font-mono">
                      {cartTotals.shippingFee === 0 ? 'FREE' : formatPrice(cartTotals.shippingFee, currency)}
                    </span>
                  </div>

                  <div className="flex justify-between text-lg font-extrabold text-slate-950 pt-3 border-t border-slate-200">
                    <span className="font-mono">Payable Total</span>
                    <span className="font-mono text-[#4353FF] font-black">
                      {formatPrice(cartTotals.total, currency)}
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting}
                  disabled={!termsAgreed || !researchUseAgreed}
                  className="w-full font-mono text-sm tracking-wide shadow-md shadow-blue-500/20 justify-center"
                >
                  <Lock className="h-4 w-4 mr-1" />
                  <span>Submit Requisition Order</span>
                </Button>

                <div className="text-[11px] text-slate-500 font-mono text-center leading-relaxed">
                  No automated credit card processing required. You will receive an invoice with exact payment verification instructions.
                </div>
              </div>
            </div>
          </div>
        </form>
      ) : (
        /* Order Confirmation Screen */
        <div className="max-w-3xl mx-auto space-y-8 animate-in zoom-in-95 duration-200">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-8 text-center space-y-3">
            <div className="h-16 w-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800 block">
              Requisition Successfully Registered
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-950">
              Order #{createdOrder?.orderNumber}
            </h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed font-sans">
              Thank you, <strong className="text-slate-900">{fullName}</strong>. Your research order has
              been submitted to our laboratory fulfillment team with status{' '}
              <Badge variant="warning" size="sm">pending_payment</Badge>.
            </p>
          </div>

          {/* Payment Instructions Box */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5">
            <h3 className="text-base font-bold font-mono text-slate-950 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Next Step: Complete Payment Settlement</span>
              <span className="font-mono text-sm font-extrabold text-[#4353FF]">
                Amount: {formatPrice(createdOrder?.total || 0, currency)}
              </span>
            </h3>

            {createdOrder?.paymentMethod === 'BANK_TRANSFER' ? (
              <div className="space-y-4 text-xs font-mono">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Beneficiary Name:</span>
                      <span className="font-bold text-slate-900">Research Peptides UK Ltd</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Bank:</span>
                      <span className="font-bold text-slate-900">Barclays Corporate UK</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Sort Code:</span>
                      <span className="font-bold text-slate-900">20-00-00</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Account Number:</span>
                      <span className="font-bold text-slate-900">89210044</span>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-slate-200">
                      <span className="text-slate-500 block text-[10px]">Mandatory Payment Reference:</span>
                      <span className="font-bold text-[#4353FF] text-sm">{createdOrder?.orderNumber}</span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] font-sans text-slate-600 leading-relaxed">
                  Please initiate a standard UK Faster Payments or SEPA transfer using your order number as the
                  payment reference. Once funds arrive in our accounts, an administrator will verify the payment
                  and dispatch your items with a tracked tracking code.
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs font-mono">
                <div className="rounded-xl bg-blue-50/70 border border-blue-200 p-4 space-y-3">
                  <span className="text-slate-700 block text-[10px] font-bold uppercase">
                    Bitcoin (BTC) Destination Address:
                  </span>
                  <div className="bg-white p-3 rounded-lg border border-blue-300 flex items-center justify-between text-xs font-bold text-slate-900">
                    <span className="truncate">bc1qrpuklab99purepeptidesresearch78x221</span>
                    <button
                      onClick={() =>
                        copyToClipboard('bc1qrpuklab99purepeptidesresearch78x221', 'crypto')
                      }
                      className="ml-2 text-slate-500 hover:text-slate-900 p-1"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-[11px] text-[#4353FF] font-semibold">
                    Amount Payable: {formatPrice(createdOrder?.total || 0, currency)} in equivalent BTC
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" size="md" onClick={() => navigate('/account')}>
                View in Customer Portal
              </Button>
              <Button variant="primary" size="md" onClick={() => navigate('/shop')} className="shadow-md shadow-blue-500/20">
                Continue to Catalogue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
