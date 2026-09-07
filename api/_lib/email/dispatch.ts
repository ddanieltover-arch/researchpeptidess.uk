import { MailOrder, MailPayment } from './blocks';
import { OrderMailKind, renderOrderEmail } from './order-templates';
import { sendRenderedPair } from './send';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function asNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function toMailOrder(input: unknown): MailOrder {
  const order = asRecord(input);
  const shipping = asRecord(order.shippingAddress);
  const billing = asRecord(order.billingAddress);
  const items = Array.isArray(order.items) ? order.items : [];

  return {
    id: String(order.id || ''),
    orderNumber: String(order.orderNumber || ''),
    customerEmail: String(order.customerEmail || shipping.email || ''),
    customerName: String(order.customerName || shipping.fullName || ''),
    currency: String(order.currency || 'GBP'),
    subtotal: asNumber(order.subtotal),
    tierDiscountAmount: asNumber(order.tierDiscountAmount),
    couponCode: asString(order.couponCode),
    couponDiscountAmount: asNumber(order.couponDiscountAmount),
    cryptoDiscountAmount: asNumber(order.cryptoDiscountAmount),
    shippingFee: asNumber(order.shippingFee),
    shippingMethodId: asString(order.shippingMethodId),
    shippingMethodName: asString(order.shippingMethodName),
    shippingCarrier: asString(order.shippingCarrier),
    shippingZone: asString(order.shippingZone),
    total: asNumber(order.total),
    paymentMethod: String(order.paymentMethod || 'BANK_TRANSFER'),
    status: String(order.status || ''),
    paymentStatus: String(order.paymentStatus || ''),
    paymentProofReference: asString(order.paymentProofReference),
    trackingNumber: asString(order.trackingNumber),
    trackingUrl: asString(order.trackingUrl),
    courier: asString(order.courier),
    cancellationReason: asString(order.cancellationReason),
    researchConsentSigned: order.researchConsentSigned !== false,
    createdAt: asString(order.createdAt) || new Date().toISOString(),
    items: items.map((raw) => {
      const item = asRecord(raw);
      return {
        id: asString(item.id),
        productName: String(item.productName || 'Item'),
        variantName: asString(item.variantName),
        size: asString(item.size),
        sku: asString(item.sku),
        variantSku: asString(item.variantSku),
        quantity: asNumber(item.quantity),
        unitPrice: asNumber(item.unitPrice),
        totalPrice: asNumber(item.totalPrice),
      };
    }),
    shippingAddress: {
      fullName: asString(shipping.fullName),
      institution: asString(shipping.institution),
      department: asString(shipping.department),
      addressLine1: asString(shipping.addressLine1),
      addressLine2: asString(shipping.addressLine2),
      city: asString(shipping.city),
      county: asString(shipping.county),
      postcode: asString(shipping.postcode),
      country: asString(shipping.country),
      countryName: asString(shipping.countryName),
      phone: asString(shipping.phone),
      email: asString(shipping.email),
    },
    billingAddress: billing.addressLine1
      ? {
          fullName: asString(billing.fullName),
          institution: asString(billing.institution),
          department: asString(billing.department),
          addressLine1: asString(billing.addressLine1),
          addressLine2: asString(billing.addressLine2),
          city: asString(billing.city),
          county: asString(billing.county),
          postcode: asString(billing.postcode),
          country: asString(billing.country),
          countryName: asString(billing.countryName),
          phone: asString(billing.phone),
          email: asString(billing.email),
        }
      : undefined,
  };
}

export function toMailPayment(input: unknown): MailPayment | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const payment = asRecord(input);
  const bank = asRecord(payment.bankDetails);
  const crypto = asRecord(payment.cryptoDetails);
  return {
    id: asString(payment.id),
    method: asString(payment.method),
    status: asString(payment.status),
    reference: asString(payment.reference),
    transactionHash: asString(payment.transactionHash),
    evidenceNotes: asString(payment.evidenceNotes),
    notes: asString(payment.notes),
    rejectionReason: asString(payment.rejectionReason),
    amount: asNumber(payment.amount),
    currency: asString(payment.currency),
    bankDetails: bank.accountNumber
      ? {
          accountName: asString(bank.accountName),
          bankName: asString(bank.bankName),
          sortCode: asString(bank.sortCode),
          accountNumber: asString(bank.accountNumber),
          iban: asString(bank.iban),
          bic: asString(bank.bic),
          reference: asString(bank.reference),
        }
      : undefined,
    cryptoDetails: crypto.walletAddress
      ? {
          network: asString(crypto.network),
          walletAddress: asString(crypto.walletAddress),
        }
      : undefined,
  };
}

export async function dispatchOrderCreatedEmails(
  orderInput: unknown,
  paymentInput?: unknown,
  reference?: string
): Promise<void> {
  const order = toMailOrder(orderInput);
  const payment = toMailPayment(paymentInput);
  const kinds: OrderMailKind[] =
    order.status === 'PAYMENT_SUBMITTED' || Boolean(order.paymentProofReference)
      ? ['ORDER_RECEIVED', 'PAYMENT_SUBMITTED']
      : ['ORDER_RECEIVED', 'PAYMENT_INSTRUCTIONS'];

  for (const kind of kinds) {
    const customer = renderOrderEmail(kind, 'customer', order, payment);
    const admin = renderOrderEmail(kind, 'admin', order, payment);
    await sendRenderedPair(order.customerEmail, customer, admin, `order_${kind.toLowerCase()}`);
  }

  console.log(
    JSON.stringify({
      level: 'info',
      operation: 'order_emails_dispatched',
      reference,
      kinds,
      orderNumber: order.orderNumber,
    })
  );
}

export async function dispatchOrderEventEmails(
  kind: OrderMailKind,
  orderInput: unknown,
  paymentInput?: unknown
): Promise<void> {
  const order = toMailOrder(orderInput);
  const payment = toMailPayment(paymentInput);
  const customer = renderOrderEmail(kind, 'customer', order, payment);
  const admin = renderOrderEmail(kind, 'admin', order, payment);
  await sendRenderedPair(order.customerEmail, customer, admin, `order_${kind.toLowerCase()}`);
}
