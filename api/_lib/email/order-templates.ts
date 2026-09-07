import { EMAIL_BRAND, EmailAudience, RenderedEmail, formatEmailDate, formatEmailMoney, sitePath } from './brand';
import { MailOrder, MailPayment, renderAddress, renderCallout, renderKvTable, renderOrderItems } from './blocks';
import { escapeHtml } from './escape';
import { wrapTransactionalEmail } from './layout';

export type OrderMailKind =
  | 'ORDER_RECEIVED'
  | 'PAYMENT_INSTRUCTIONS'
  | 'PAYMENT_SUBMITTED'
  | 'PAYMENT_VERIFIED'
  | 'PAYMENT_REJECTED'
  | 'ORDER_PROCESSING'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'REFUND_PROCESSED';

function finish(subject: string, layout: ReturnType<typeof wrapTransactionalEmail>): RenderedEmail {
  return { subject: subject.replace(/[\r\n]+/g, ' ').slice(0, 180), ...layout };
}

function greetingName(name?: string): string {
  const trimmed = (name || '').trim();
  return trimmed || 'there';
}

function statusLabel(status: string): string {
  return (status || '').replace(/_/g, ' ').toLowerCase();
}

function paymentMethodLabel(method?: string): string {
  if (method === 'BANK_TRANSFER') return 'UK Faster Payments / bank transfer';
  if (method === 'CRYPTOCURRENCY' || method === 'CRYPTO') return 'Cryptocurrency';
  return method || 'Settlement';
}

function readEnv(name: string): string {
  return (typeof process !== 'undefined' && process.env && process.env[name] ? process.env[name] : '').trim();
}

function settlementBlock(order: MailOrder, payment?: MailPayment): string {
  const due = formatEmailMoney(order.total, order.currency || 'GBP');
  const reference = payment?.reference || order.orderNumber;
  const method = order.paymentMethod || payment?.method || 'BANK_TRANSFER';

  if (method === 'CRYPTOCURRENCY' || method === 'CRYPTO') {
    const wallet = payment?.cryptoDetails?.walletAddress || readEnv('CRYPTO_BTC_WALLET_ADDRESS');
    const network = payment?.cryptoDetails?.network || 'BTC';
    if (!wallet || /sample|your-wallet|bc1q9v8084/i.test(wallet)) {
      return renderCallout(
        'Wallet not published',
        `Please email ${escapeHtml(EMAIL_BRAND.supportEmail)} with order <strong>${escapeHtml(order.orderNumber)}</strong> before sending cryptocurrency.`,
        'warning'
      );
    }
    return (
      renderCallout(
        'Cryptocurrency settlement',
        `Send the GBP-equivalent of <strong>${escapeHtml(due)}</strong> on <strong>${escapeHtml(network)}</strong>. Use order <strong>${escapeHtml(reference)}</strong> as your reference.`,
        'info'
      ) +
      renderKvTable([
        { label: 'Network', value: escapeHtml(network) },
        { label: 'Wallet', value: `<span style="word-break:break-all;">${escapeHtml(wallet)}</span>` },
        { label: 'Amount due', value: escapeHtml(due) },
        { label: 'Order reference', value: escapeHtml(reference) },
      ])
    );
  }

  const sortCode = readEnv('BANK_TRANSFER_SORT_CODE');
  const accountNumber = readEnv('BANK_TRANSFER_ACCOUNT_NUMBER');
  const accountName = readEnv('BANK_TRANSFER_ACCOUNT_NAME') || 'Research Peptides UK';
  const bankName = readEnv('BANK_TRANSFER_BANK_NAME') || 'UK Faster Payments';
  const bank = payment?.bankDetails?.accountNumber
    ? payment.bankDetails
    : sortCode && accountNumber && !/20-00-00|12345678/i.test(`${sortCode}${accountNumber}`)
      ? { accountName, bankName, sortCode, accountNumber, reference }
      : null;

  if (!bank) {
    return renderCallout(
      'Bank details not published',
      `Please email ${escapeHtml(EMAIL_BRAND.supportEmail)} with order <strong>${escapeHtml(order.orderNumber)}</strong> before sending ${escapeHtml(due)}. Do not transfer to an unpublished destination.`,
      'warning'
    );
  }

  return (
    renderCallout(
      'Faster Payments instructions',
      `Please remit <strong>${escapeHtml(due)}</strong> using payment reference <strong>${escapeHtml(bank.reference || reference)}</strong>. Settlement is verified manually after receipt.`,
      'info'
    ) +
    renderKvTable([
      { label: 'Account name', value: escapeHtml(bank.accountName || accountName) },
      { label: 'Bank', value: escapeHtml(bank.bankName || bankName) },
      { label: 'Sort code', value: escapeHtml(bank.sortCode || sortCode) },
      { label: 'Account number', value: escapeHtml(bank.accountNumber || accountNumber) },
      { label: 'Reference', value: escapeHtml(bank.reference || reference) },
      { label: 'Amount', value: escapeHtml(due) },
    ])
  );
}

function orderSummary(order: MailOrder, payment?: MailPayment): string {
  return (
    renderKvTable([
      { label: 'Order', value: escapeHtml(order.orderNumber) },
      { label: 'Placed', value: escapeHtml(formatEmailDate(order.createdAt)) },
      { label: 'Status', value: escapeHtml(statusLabel(order.status || '')) },
      { label: 'Settlement', value: escapeHtml(paymentMethodLabel(order.paymentMethod || payment?.method)) },
      { label: 'Payment status', value: escapeHtml(statusLabel(order.paymentStatus || payment?.status || '')) },
      { label: 'Customer', value: `${escapeHtml(order.customerName)} &lt;${escapeHtml(order.customerEmail)}&gt;` },
    ]) +
    renderOrderItems(order) +
    renderAddress(order)
  );
}

function customerSubject(kind: OrderMailKind, orderNumber: string): string {
  switch (kind) {
    case 'ORDER_RECEIVED':
      return `Order confirmed · ${orderNumber} | ${EMAIL_BRAND.name}`;
    case 'PAYMENT_INSTRUCTIONS':
      return `Payment instructions · ${orderNumber} | ${EMAIL_BRAND.name}`;
    case 'PAYMENT_SUBMITTED':
      return `Payment evidence received · ${orderNumber} | ${EMAIL_BRAND.name}`;
    case 'PAYMENT_VERIFIED':
      return `Payment verified · ${orderNumber} | ${EMAIL_BRAND.name}`;
    case 'PAYMENT_REJECTED':
      return `Action required: payment not verified · ${orderNumber}`;
    case 'ORDER_PROCESSING':
      return `Your order is in laboratory preparation · ${orderNumber}`;
    case 'ORDER_SHIPPED':
      return `Your order has been dispatched · ${orderNumber}`;
    case 'ORDER_DELIVERED':
      return `Delivery confirmed · ${orderNumber} | ${EMAIL_BRAND.name}`;
    case 'ORDER_CANCELLED':
      return `Order cancelled · ${orderNumber} | ${EMAIL_BRAND.name}`;
    case 'REFUND_PROCESSED':
      return `Refund recorded · ${orderNumber} | ${EMAIL_BRAND.name}`;
    default:
      return `Order update · ${orderNumber} | ${EMAIL_BRAND.name}`;
  }
}

export function renderOrderEmail(
  kind: OrderMailKind,
  audience: EmailAudience,
  order: MailOrder,
  payment?: MailPayment
): RenderedEmail {
  const ref = order.orderNumber;
  const due = formatEmailMoney(order.total, order.currency || 'GBP');
  const account = sitePath('/account');
  const shop = sitePath('/shop');

  if (audience === 'admin') {
    const titles: Record<OrderMailKind, string> = {
      ORDER_RECEIVED: `New order ${ref}`,
      PAYMENT_INSTRUCTIONS: `Payment instructions sent for ${ref}`,
      PAYMENT_SUBMITTED: `Payment evidence queued · ${ref}`,
      PAYMENT_VERIFIED: `${ref} marked verified`,
      PAYMENT_REJECTED: `Payment rejected · ${ref}`,
      ORDER_PROCESSING: `${ref} moved to processing`,
      ORDER_SHIPPED: `${ref} marked shipped`,
      ORDER_DELIVERED: `${ref} marked delivered`,
      ORDER_CANCELLED: `${ref} cancelled`,
      REFUND_PROCESSED: `Refund recorded · ${ref}`,
    };
    const intros: Record<OrderMailKind, string> = {
      ORDER_RECEIVED: `${order.customerName} placed a ${due} order. Items are reserved pending settlement verification.`,
      PAYMENT_INSTRUCTIONS: `The customer was sent ${paymentMethodLabel(order.paymentMethod)} instructions for ${due}.`,
      PAYMENT_SUBMITTED: 'A customer submitted payment evidence. Reconcile it in the admin verification queue.',
      PAYMENT_VERIFIED: `Settlement of ${due} is recorded as verified.`,
      PAYMENT_REJECTED: 'The customer was asked to resubmit evidence.',
      ORDER_PROCESSING: 'Laboratory preparation has started.',
      ORDER_SHIPPED: `Tracking ${order.trackingNumber || 'not supplied'} via ${order.courier || 'nominated courier'}.`,
      ORDER_DELIVERED: 'Delivery confirmation was sent to the customer.',
      ORDER_CANCELLED: 'Confirm that reserved stock has been released.',
      REFUND_PROCESSED: `A refund of ${due} was logged.`,
    };
    const extra =
      kind === 'PAYMENT_SUBMITTED'
        ? renderCallout('Submitted reference', escapeHtml(order.paymentProofReference || payment?.transactionHash || 'See admin record'), 'admin')
        : '';

    return finish(
      `[RP-UK] ${titles[kind]}`,
      wrapTransactionalEmail({
        audience,
        preheader: `${ref} · ${statusLabel(order.status || '')} · ${due}`,
        eyebrow: 'Operations alert',
        title: titles[kind],
        intro: intros[kind],
        bodyHtml: extra + orderSummary(order, payment),
        cta: { label: 'Open admin orders', href: sitePath('/admin') },
        secondaryCta: { label: 'Catalogue', href: shop },
        footerNote: 'Internal operations copy. Customer PII is included for fulfilment only.',
      })
    );
  }

  const copy: Record<
    OrderMailKind,
    { eyebrow: string; title: string; intro: string; extra: string; cta: string; ctaHref: string; secondary?: string; secondaryHref?: string }
  > = {
    ORDER_RECEIVED: {
      eyebrow: 'Order confirmation',
      title: `Order ${ref} is registered`,
      intro: `Hello ${greetingName(order.customerName)}. We have recorded your research catalogue order. Items are reserved pending settlement — this is not dispatch confirmation.`,
      extra: renderCallout('What happens next', 'Complete settlement using the instructions in the following email, then submit your payment reference from your account.', 'info'),
      cta: 'View order in account',
      ctaHref: account,
      secondary: 'Browse catalogue',
      secondaryHref: shop,
    },
    PAYMENT_INSTRUCTIONS: {
      eyebrow: 'Settlement instructions',
      title: `How to pay ${due}`,
      intro: `Use the destination details below for order ${ref}. Always include the payment reference so finance can match your transfer.`,
      extra: settlementBlock(order, payment),
      cta: 'Submit payment evidence',
      ctaHref: account,
      secondary: 'Contact operations',
      secondaryHref: `mailto:${EMAIL_BRAND.supportEmail}?subject=${encodeURIComponent(`Payment help · ${ref}`)}`,
    },
    PAYMENT_SUBMITTED: {
      eyebrow: 'Payment evidence',
      title: 'Your settlement reference is in review',
      intro: `We received payment evidence for ${ref}. Finance will reconcile it manually.`,
      extra: renderKvTable([{ label: 'Reference submitted', value: escapeHtml(order.paymentProofReference || payment?.transactionHash || 'Recorded') }]),
      cta: 'Open your account',
      ctaHref: account,
    },
    PAYMENT_VERIFIED: {
      eyebrow: 'Settlement verified',
      title: `${due} has been cleared`,
      intro: `Finance verified settlement for ${ref}. The order is cleared for laboratory preparation.`,
      extra: renderCallout('Cleared', 'You do not need to send further funds for this order unless operations contact you.', 'success'),
      cta: 'Track order status',
      ctaHref: account,
    },
    PAYMENT_REJECTED: {
      eyebrow: 'Action required',
      title: 'We could not verify this payment',
      intro: `The evidence for ${ref} could not be reconciled. Please check the reference and submit again.`,
      extra: renderCallout('Reason', escapeHtml(payment?.rejectionReason || 'Statement reference mismatch'), 'danger'),
      cta: 'Resubmit evidence',
      ctaHref: account,
    },
    ORDER_PROCESSING: {
      eyebrow: 'Laboratory preparation',
      title: 'Your vials are being prepared',
      intro: `${ref} is in quality inspection, vacuum packaging, and batch documentation checks.`,
      extra: '',
      cta: 'View order',
      ctaHref: account,
    },
    ORDER_SHIPPED: {
      eyebrow: 'Dispatched',
      title: `${ref} is on its way`,
      intro: `The consignment has been handed to ${order.courier || 'the nominated courier'}. Keep lyophilized material frozen on arrival.`,
      extra: order.trackingNumber
        ? renderCallout('Tracking', `${escapeHtml(order.courier || 'Courier')} · <strong>${escapeHtml(order.trackingNumber)}</strong>`, 'success')
        : '',
      cta: order.trackingNumber ? 'Track consignment' : 'View order',
      ctaHref: order.trackingUrl || account,
      secondary: 'Open account',
      secondaryHref: account,
    },
    ORDER_DELIVERED: {
      eyebrow: 'Delivered',
      title: 'Delivery has been confirmed',
      intro: `${ref} is marked delivered. Store lyophilized vials at −20 °C unless the product page specifies otherwise.`,
      extra: '',
      cta: 'View order',
      ctaHref: account,
    },
    ORDER_CANCELLED: {
      eyebrow: 'Order cancelled',
      title: `${ref} has been cancelled`,
      intro: 'The order is cancelled and any active inventory reservation has been released.',
      extra: order.cancellationReason ? renderCallout('Note', escapeHtml(order.cancellationReason), 'warning') : '',
      cta: 'Browse the catalogue',
      ctaHref: shop,
    },
    REFUND_PROCESSED: {
      eyebrow: 'Refund recorded',
      title: `A refund for ${ref} is recorded`,
      intro: `A refund of ${due} has been recorded against this order.`,
      extra: '',
      cta: 'View order',
      ctaHref: account,
    },
  };

  const selected = copy[kind];
  return finish(
    customerSubject(kind, ref),
    wrapTransactionalEmail({
      audience,
      preheader: selected.intro,
      eyebrow: selected.eyebrow,
      title: selected.title,
      intro: selected.intro,
      bodyHtml: selected.extra + orderSummary(order, payment),
      cta: { label: selected.cta, href: selected.ctaHref },
      secondaryCta:
        selected.secondary && selected.secondaryHref
          ? { label: selected.secondary, href: selected.secondaryHref }
          : undefined,
    })
  );
}
