import { NotificationType, Order, Payment } from '../../types';
import { NEWSLETTER_TOPIC_OPTIONS } from '../newsletter';
import { STORE_CONTACT_EMAIL } from '../store-contact';
import { getBankSettlementInstructions, getCryptoSettlementInstructions } from '../settlement-instructions';
import { EMAIL_BRAND, EmailAudience, RenderedEmail, formatEmailDate, formatEmailMoney, isSafeEmailHref, sitePath } from './brand';
import { escapeAttribute, escapeHtml } from './escape';
import { renderAddress, renderCallout, renderKvTable, renderMessagePanel, renderOrderItems } from './blocks';
import { wrapTransactionalEmail } from './layout';

export interface ContactEmailInput {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  createdAt: string;
}

export interface NewsletterEmailInput {
  email: string;
  topics: string[];
  created: boolean;
}

export interface AccountEmailInput {
  name: string;
  email: string;
  institution?: string;
}

function finish(
  subject: string,
  layout: ReturnType<typeof wrapTransactionalEmail>
): RenderedEmail {
  return { subject: subject.replace(/[\r\n]+/g, ' ').slice(0, 180), ...layout };
}

function greetingName(name?: string): string {
  const trimmed = (name || '').trim();
  return trimmed || 'there';
}

function topicLabels(topics: string[]): string {
  const labels = topics.map((topic) => {
    const match = NEWSLETTER_TOPIC_OPTIONS.find((option) => option.id === topic);
    return match ? match.label : topic.replace(/_/g, ' ').toLowerCase();
  });
  return labels.length ? labels.join(', ') : 'Catalogue updates';
}

function paymentMethodLabel(method?: string): string {
  if (method === 'BANK_TRANSFER') return 'UK Faster Payments / bank transfer';
  if (method === 'CRYPTO') return 'Cryptocurrency';
  return method || 'Settlement';
}

function statusLabel(status: string): string {
  return status.replace(/_/g, ' ').toLowerCase();
}

function trackingHref(order: Order): string {
  const fallback = `https://www.royalmail.com/track-your-item#/tracking-results/${encodeURIComponent(order.trackingNumber || '')}`;
  const candidate = order.trackingUrl || fallback;
  return isSafeEmailHref(candidate) ? candidate : sitePath('/account');
}

function trackingBlock(order: Order): string {
  if (!order.trackingNumber) return '';
  const href = trackingHref(order);
  return renderCallout(
    'Tracking',
    `${escapeHtml(order.courier || 'Royal Mail Tracked')} · <strong>${escapeHtml(order.trackingNumber)}</strong><br /><a href="${escapeAttribute(href)}" style="color:${EMAIL_BRAND.colors.primary}; font-weight:700;">View tracking</a>`,
    'success'
  );
}

function settlementBlock(order: Order, payment?: Payment): string {
  const due = formatEmailMoney(order.total, order.currency);
  const reference = payment?.reference || order.orderNumber;

  if (order.paymentMethod === 'BANK_TRANSFER') {
    const bank = payment?.bankDetails?.accountNumber
      ? payment.bankDetails
      : getBankSettlementInstructions().configured
        ? {
            accountName: getBankSettlementInstructions().accountName,
            bankName: getBankSettlementInstructions().bankName,
            sortCode: getBankSettlementInstructions().sortCode,
            accountNumber: getBankSettlementInstructions().accountNumber,
            iban: getBankSettlementInstructions().iban,
            bic: getBankSettlementInstructions().bic,
            reference,
          }
        : null;

    if (!bank) {
      return renderCallout(
        'Bank details not published',
        `Please email ${escapeHtml(STORE_CONTACT_EMAIL)} with order <strong>${escapeHtml(order.orderNumber)}</strong> before sending ${escapeHtml(due)}. Do not transfer to an unpublished destination.`,
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
        { label: 'Account name', value: escapeHtml(bank.accountName) },
        { label: 'Bank', value: escapeHtml(bank.bankName) },
        { label: 'Sort code', value: escapeHtml(bank.sortCode) },
        { label: 'Account number', value: escapeHtml(bank.accountNumber) },
        { label: 'IBAN', value: bank.iban ? escapeHtml(bank.iban) : '' },
        { label: 'BIC', value: bank.bic ? escapeHtml(bank.bic) : '' },
        { label: 'Reference', value: escapeHtml(bank.reference || reference) },
        { label: 'Amount', value: escapeHtml(due) },
      ])
    );
  }

  const crypto = payment?.cryptoDetails?.walletAddress
    ? payment.cryptoDetails
    : getCryptoSettlementInstructions().configured
      ? getCryptoSettlementInstructions()
      : null;

  if (!crypto) {
    return renderCallout(
      'Wallet not published',
      `Please email ${escapeHtml(STORE_CONTACT_EMAIL)} with order <strong>${escapeHtml(order.orderNumber)}</strong> before sending cryptocurrency.`,
      'warning'
    );
  }

  return (
    renderCallout(
      'Cryptocurrency settlement',
      `A 5% crypto discount is already reflected in the total. Send the GBP-equivalent of <strong>${escapeHtml(due)}</strong> on <strong>${escapeHtml(crypto.network)}</strong>. Do not send from an exchange that cannot include a memo if one is required.`,
      'info'
    ) +
    renderKvTable([
      { label: 'Network', value: escapeHtml(crypto.network) },
      { label: 'Wallet', value: `<span style="word-break:break-all;">${escapeHtml(crypto.walletAddress)}</span>` },
      { label: 'Amount due', value: escapeHtml(due) },
      { label: 'Order reference', value: escapeHtml(reference) },
    ])
  );
}

function orderSummary(order: Order, payment?: Payment): string {
  return (
    renderKvTable([
      { label: 'Order', value: escapeHtml(order.orderNumber) },
      { label: 'Placed', value: escapeHtml(formatEmailDate(order.createdAt)) },
      { label: 'Status', value: escapeHtml(statusLabel(order.status)) },
      { label: 'Settlement', value: escapeHtml(paymentMethodLabel(order.paymentMethod)) },
      { label: 'Payment status', value: escapeHtml(statusLabel(order.paymentStatus || payment?.status || '')) },
      { label: 'Customer', value: `${escapeHtml(order.customerName)} &lt;${escapeHtml(order.customerEmail)}&gt;` },
    ]) +
    renderOrderItems(order) +
    renderAddress(order)
  );
}

export function renderContactEmail(audience: EmailAudience, input: ContactEmailInput): RenderedEmail {
  if (audience === 'admin') {
    return finish(
      `[RP-UK] New enquiry from ${input.name}`,
      wrapTransactionalEmail({
        audience,
        preheader: `${input.name} submitted a storefront enquiry.`,
        eyebrow: 'Contact form · operations',
        title: 'A laboratory enquiry is waiting',
        intro: 'A storefront contact form was submitted with consent. Reply from this thread to reach the sender directly.',
        bodyHtml:
          renderKvTable([
            { label: 'From', value: `${escapeHtml(input.name)} &lt;${escapeHtml(input.email)}&gt;` },
            { label: 'Subject', value: escapeHtml(input.subject || 'Operations enquiry') },
            { label: 'Enquiry ID', value: escapeHtml(input.id) },
            { label: 'Received', value: escapeHtml(formatEmailDate(input.createdAt)) },
          ]) + renderMessagePanel('Message', input.message),
        cta: { label: 'Reply to sender', href: `mailto:${input.email}` },
        footerNote: 'This alert is for operations staff only. Do not forward personal data outside the support workflow.',
      })
    );
  }

  return finish(
    `We received your enquiry | ${EMAIL_BRAND.name}`,
    wrapTransactionalEmail({
      audience,
      preheader: 'Your message reached the Research Peptides UK operations desk.',
      eyebrow: 'Contact form',
      title: `Thank you, ${greetingName(input.name)}`,
      intro: 'Your enquiry has been stored for the operations team. We will reply to this email address. This message does not confirm a response time or an order.',
      bodyHtml:
        renderKvTable([
          { label: 'Subject', value: escapeHtml(input.subject || 'Operations enquiry') },
          { label: 'Reference', value: escapeHtml(input.id) },
        ]) + renderMessagePanel('Your message', input.message),
      cta: { label: 'Browse the catalogue', href: sitePath('/shop') },
      footerNote: `If you did not send this, ignore the email or write to ${EMAIL_BRAND.supportEmail}.`,
    })
  );
}

export function renderNewsletterEmail(audience: EmailAudience, input: NewsletterEmailInput): RenderedEmail {
  const topics = topicLabels(input.topics);

  if (audience === 'admin') {
    return finish(
      `[RP-UK] ${input.created ? 'New' : 'Updated'} catalogue subscription`,
      wrapTransactionalEmail({
        audience,
        preheader: `${input.email} ${input.created ? 'joined' : 'updated'} update topics.`,
        eyebrow: 'Newsletter form · operations',
        title: input.created ? 'New consented subscription' : 'Subscription topics updated',
        intro: 'A storefront visitor consented to store their email for selected research-update topics.',
        bodyHtml: renderKvTable([
          { label: 'Email', value: escapeHtml(input.email) },
          { label: 'Topics', value: escapeHtml(topics) },
          { label: 'Event', value: input.created ? 'Created' : 'Updated' },
        ]),
        footerNote: 'Mailing-list broadcasts still require a separate campaign send. This is a transactional notice only.',
      })
    );
  }

  return finish(
    `You are subscribed to ${EMAIL_BRAND.name} updates`,
    wrapTransactionalEmail({
      audience,
      preheader: 'Your consented research-update preferences are stored.',
      eyebrow: 'Catalogue updates',
      title: 'Subscription confirmed',
      intro: 'We stored your email with consent for the topics below. You will only receive messages that match these selections.',
      bodyHtml:
        renderCallout('Selected topics', escapeHtml(topics), 'success') +
        renderKvTable([{ label: 'Email', value: escapeHtml(input.email) }]),
      cta: { label: 'Visit the catalogue', href: sitePath('/shop') },
      footerNote: `To change topics or stop updates, reply to this email or write to ${EMAIL_BRAND.supportEmail}.`,
    })
  );
}

export function renderAccountEmail(audience: EmailAudience, input: AccountEmailInput): RenderedEmail {
  if (audience === 'admin') {
    return finish(
      `[RP-UK] New laboratory account · ${input.email}`,
      wrapTransactionalEmail({
        audience,
        preheader: `${input.name} created a customer account.`,
        eyebrow: 'Account registration · operations',
        title: 'A new customer account was created',
        intro: 'A laboratory buyer completed account registration on the storefront.',
        bodyHtml: renderKvTable([
          { label: 'Name', value: escapeHtml(input.name) },
          { label: 'Email', value: escapeHtml(input.email) },
          { label: 'Institution', value: escapeHtml(input.institution || 'Not provided') },
        ]),
        cta: { label: 'Open admin', href: sitePath('/admin') },
      })
    );
  }

  return finish(
    `Your ${EMAIL_BRAND.name} account is ready`,
    wrapTransactionalEmail({
      audience,
      preheader: 'Sign in to review orders, payment evidence, and saved compounds.',
      eyebrow: 'Customer account',
      title: `Welcome, ${greetingName(input.name)}`,
      intro: 'Your laboratory account is active. Use it to place research-only orders, submit settlement evidence, and follow dispatch updates.',
      bodyHtml: renderKvTable([
        { label: 'Sign-in email', value: escapeHtml(input.email) },
        { label: 'Institution', value: escapeHtml(input.institution || 'Not provided') },
      ]),
      cta: { label: 'Open your account', href: sitePath('/account') },
      footerNote: 'We will never ask for your password by email.',
    })
  );
}

function customerOrderCopy(
  type: NotificationType,
  order: Order,
  payment?: Payment
): { eyebrow: string; title: string; intro: string; extra: string; ctaLabel: string; ctaHref: string; footer?: string } {
  const ref = order.orderNumber;
  const due = formatEmailMoney(order.total, order.currency);
  const account = sitePath('/account');

  switch (type) {
    case 'ORDER_RECEIVED':
      return {
        eyebrow: 'Order confirmation',
        title: `Order ${ref} is registered`,
        intro: `Hello ${greetingName(order.customerName)}. We have recorded your research catalogue order. Items are reserved pending settlement — this is not dispatch confirmation.`,
        extra: renderCallout('What happens next', 'Complete settlement using the instructions in the following email, then submit your payment reference from your account.', 'info'),
        ctaLabel: 'View order in account',
        ctaHref: account,
      };
    case 'PAYMENT_INSTRUCTIONS':
      return {
        eyebrow: 'Settlement instructions',
        title: `How to pay ${due}`,
        intro: `Use the destination details below for order ${ref}. Always include the payment reference so finance can match your transfer.`,
        extra: settlementBlock(order, payment),
        ctaLabel: 'Submit payment evidence',
        ctaHref: account,
      };
    case 'PAYMENT_SUBMITTED':
      return {
        eyebrow: 'Payment evidence',
        title: 'Your settlement reference is in review',
        intro: `We received payment evidence for ${ref}. Finance will reconcile it manually. Do not send a second transfer unless we ask.`,
        extra: renderKvTable([
          { label: 'Reference submitted', value: escapeHtml(order.paymentProofReference || payment?.transactionHash || 'Recorded') },
        ]),
        ctaLabel: 'Open your account',
        ctaHref: account,
      };
    case 'PAYMENT_VERIFIED':
      return {
        eyebrow: 'Settlement verified',
        title: `${due} has been cleared`,
        intro: `Finance verified settlement for ${ref}. The order is cleared for laboratory preparation and QC packaging.`,
        extra: renderCallout('Cleared', 'You do not need to send further funds for this order unless operations contact you.', 'success'),
        ctaLabel: 'Track order status',
        ctaHref: account,
      };
    case 'PAYMENT_REJECTED':
      return {
        eyebrow: 'Action required',
        title: 'We could not verify this payment',
        intro: `The evidence for ${ref} could not be reconciled. Please check the reference and submit again, or write to operations with a statement screenshot.`,
        extra: renderCallout(
          'Reason',
          escapeHtml(payment?.rejectionReason || 'Statement reference mismatch'),
          'danger'
        ),
        ctaLabel: 'Resubmit evidence',
        ctaHref: account,
      };
    case 'ORDER_PROCESSING':
      return {
        eyebrow: 'Laboratory preparation',
        title: 'Your vials are being prepared',
        intro: `${ref} is in quality inspection, vacuum packaging, and batch documentation checks.`,
        extra: '',
        ctaLabel: 'View order',
        ctaHref: account,
      };
    case 'ORDER_SHIPPED':
      return {
        eyebrow: 'Dispatched',
        title: `${ref} is on its way`,
        intro: `The consignment has been handed to ${order.courier || 'the nominated courier'}. Keep lyophilized material frozen on arrival.`,
        extra: trackingBlock(order),
        ctaLabel: order.trackingNumber ? 'Track consignment' : 'View order',
        ctaHref: order.trackingNumber ? trackingHref(order) : account,
      };
    case 'ORDER_DELIVERED':
      return {
        eyebrow: 'Delivered',
        title: 'Delivery has been confirmed',
        intro: `${ref} is marked delivered to ${order.shippingAddress?.institution || order.shippingAddress?.fullName || 'the shipping address'}. Store lyophilized vials at −20 °C unless the product page specifies otherwise.`,
        extra: trackingBlock(order),
        ctaLabel: 'View order',
        ctaHref: account,
      };
    case 'ORDER_CANCELLED':
      return {
        eyebrow: 'Order cancelled',
        title: `${ref} has been cancelled`,
        intro: 'The order is cancelled and any active inventory reservation has been released. If funds were received they will be handled separately.',
        extra: order.cancellationReason
          ? renderCallout('Note', escapeHtml(order.cancellationReason), 'warning')
          : '',
        ctaLabel: 'Browse the catalogue',
        ctaHref: sitePath('/shop'),
      };
    case 'REFUND_PROCESSED':
      return {
        eyebrow: 'Refund recorded',
        title: `A refund for ${ref} is recorded`,
        intro: `A refund of ${due} has been recorded against this order. Bank or chain timing depends on the original settlement method.`,
        extra: '',
        ctaLabel: 'View order',
        ctaHref: account,
      };
    default:
      return {
        eyebrow: 'Order update',
        title: `${ref} was updated`,
        intro: `The status of order ${ref} has changed.`,
        extra: '',
        ctaLabel: 'View order',
        ctaHref: account,
      };
  }
}

function adminOrderCopy(
  type: NotificationType,
  order: Order,
  payment?: Payment
): { eyebrow: string; title: string; intro: string; extra: string } {
  const ref = order.orderNumber;
  const due = formatEmailMoney(order.total, order.currency);

  switch (type) {
    case 'ORDER_RECEIVED':
      return {
        eyebrow: 'New order · operations',
        title: `New order ${ref}`,
        intro: `${order.customerName} placed a ${due} order. Items are reserved pending settlement verification.`,
        extra: '',
      };
    case 'PAYMENT_INSTRUCTIONS':
      return {
        eyebrow: 'Settlement issued · operations',
        title: `Payment instructions sent for ${ref}`,
        intro: `The customer was sent ${paymentMethodLabel(order.paymentMethod)} instructions for ${due}.`,
        extra: '',
      };
    case 'PAYMENT_SUBMITTED':
      return {
        eyebrow: 'Verification queue',
        title: `Payment evidence queued · ${ref}`,
        intro: 'A customer submitted a Faster Payments reference or transaction hash. Reconcile it in the admin verification queue.',
        extra: renderCallout(
          'Submitted reference',
          escapeHtml(order.paymentProofReference || payment?.transactionHash || 'See admin record'),
          'admin'
        ),
      };
    case 'PAYMENT_VERIFIED':
      return {
        eyebrow: 'Finance audit',
        title: `${ref} marked verified`,
        intro: `Settlement of ${due} is recorded as verified. Prepare the order for processing when ready.`,
        extra: '',
      };
    case 'PAYMENT_REJECTED':
      return {
        eyebrow: 'Finance audit',
        title: `Payment rejected · ${ref}`,
        intro: 'The customer was asked to resubmit evidence. Inventory reservation remains until expiry or cancellation.',
        extra: renderCallout('Reason logged', escapeHtml(payment?.rejectionReason || 'Not specified'), 'danger'),
      };
    case 'ORDER_PROCESSING':
      return {
        eyebrow: 'Fulfilment',
        title: `${ref} moved to processing`,
        intro: 'The customer was notified that laboratory preparation has started.',
        extra: '',
      };
    case 'ORDER_SHIPPED':
      return {
        eyebrow: 'Dispatch',
        title: `${ref} marked shipped`,
        intro: `Tracking ${order.trackingNumber || 'not supplied'} via ${order.courier || 'nominated courier'}.`,
        extra: trackingBlock(order),
      };
    case 'ORDER_DELIVERED':
      return {
        eyebrow: 'Delivery',
        title: `${ref} marked delivered`,
        intro: 'The customer received a delivery confirmation and storage reminder.',
        extra: '',
      };
    case 'ORDER_CANCELLED':
      return {
        eyebrow: 'Cancellation',
        title: `${ref} cancelled`,
        intro: 'The customer was notified. Confirm that reserved stock has been released.',
        extra: '',
      };
    case 'REFUND_PROCESSED':
      return {
        eyebrow: 'Refund',
        title: `Refund recorded · ${ref}`,
        intro: `A refund of ${due} was logged. Confirm the originating bank or chain transfer separately.`,
        extra: '',
      };
    default:
      return {
        eyebrow: 'Order event',
        title: `${ref} updated`,
        intro: 'An order lifecycle event was dispatched.',
        extra: '',
      };
  }
}

export function renderOrderEmail(
  type: NotificationType,
  audience: EmailAudience,
  order: Order,
  payment?: Payment
): RenderedEmail {
  const ref = order.orderNumber;

  if (audience === 'admin') {
    const copy = adminOrderCopy(type, order, payment);
    return finish(
      `[RP-UK] ${copy.title}`,
      wrapTransactionalEmail({
        audience,
        preheader: `${ref} · ${statusLabel(order.status)} · ${formatEmailMoney(order.total, order.currency)}`,
        eyebrow: copy.eyebrow,
        title: copy.title,
        intro: copy.intro,
        bodyHtml: copy.extra + orderSummary(order, payment),
        cta: { label: 'Open admin orders', href: sitePath('/admin') },
        footerNote: 'Internal operations copy. Customer PII is included for fulfilment only.',
      })
    );
  }

  const copy = customerOrderCopy(type, order, payment);
  return finish(
    customerSubject(type, ref),
    wrapTransactionalEmail({
      audience,
      preheader: copy.intro,
      eyebrow: copy.eyebrow,
      title: copy.title,
      intro: copy.intro,
      bodyHtml: copy.extra + orderSummary(order, payment),
      cta: { label: copy.ctaLabel, href: copy.ctaHref },
      footerNote: copy.footer,
    })
  );
}

export function customerSubject(type: NotificationType, orderNumber: string): string {
  const ref = orderNumber;
  switch (type) {
    case 'ORDER_RECEIVED':
      return `Order confirmed · ${ref} | ${EMAIL_BRAND.name}`;
    case 'PAYMENT_INSTRUCTIONS':
      return `Payment instructions · ${ref} | ${EMAIL_BRAND.name}`;
    case 'PAYMENT_SUBMITTED':
      return `Payment evidence received · ${ref} | ${EMAIL_BRAND.name}`;
    case 'PAYMENT_VERIFIED':
      return `Payment verified · ${ref} | ${EMAIL_BRAND.name}`;
    case 'PAYMENT_REJECTED':
      return `Action required: payment not verified · ${ref}`;
    case 'ORDER_PROCESSING':
      return `Your order is in laboratory preparation · ${ref}`;
    case 'ORDER_SHIPPED':
      return `Your order has been dispatched · ${ref}`;
    case 'ORDER_DELIVERED':
      return `Delivery confirmed · ${ref} | ${EMAIL_BRAND.name}`;
    case 'ORDER_CANCELLED':
      return `Order cancelled · ${ref} | ${EMAIL_BRAND.name}`;
    case 'REFUND_PROCESSED':
      return `Refund recorded · ${ref} | ${EMAIL_BRAND.name}`;
    default:
      return `Order update · ${ref} | ${EMAIL_BRAND.name}`;
  }
}

export function inferOrderNotificationType(order: Order, payment?: Payment): NotificationType | null {
  if (payment?.status === 'FAILED' || order.paymentStatus === 'FAILED') {
    return 'PAYMENT_REJECTED';
  }
  switch (order.status) {
    case 'PENDING_PAYMENT':
      return 'PAYMENT_INSTRUCTIONS';
    case 'PAYMENT_SUBMITTED':
      return 'PAYMENT_SUBMITTED';
    case 'PAYMENT_VERIFIED':
      return 'PAYMENT_VERIFIED';
    case 'PROCESSING':
    case 'PARTIALLY_FULFILLED':
      return 'ORDER_PROCESSING';
    case 'SHIPPED':
      return 'ORDER_SHIPPED';
    case 'DELIVERED':
      return 'ORDER_DELIVERED';
    case 'CANCELLED':
    case 'PAYMENT_EXPIRED':
      return 'ORDER_CANCELLED';
    case 'REFUNDED':
      return 'REFUND_PROCESSED';
    default:
      return null;
  }
}

export function orderEmailPlainSummary(
  type: NotificationType,
  order: Order,
  payment?: Payment
): { subject: string; contentSummary: string } {
  const rendered = renderOrderEmail(type, 'customer', order, payment);
  const compact = rendered.text.replace(/\s+/g, ' ').trim();
  return {
    subject: rendered.subject,
    contentSummary: compact.slice(0, 280),
  };
}
