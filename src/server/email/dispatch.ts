import { NotificationType, Order, Payment } from '../../types';
import {
  inferOrderNotificationType,
  renderAccountEmail,
  renderContactEmail,
  renderNewsletterEmail,
  renderOrderEmail,
  type AccountEmailInput,
  type ContactEmailInput,
  type NewsletterEmailInput,
} from '../../lib/email/templates';
import { getEmailRuntimeConfig } from './config';
import { sendTransactionalEmails, type OutboundEmail } from './send';

function pair(
  kind: string,
  customer: ReturnType<typeof renderContactEmail>,
  admin: ReturnType<typeof renderContactEmail>,
  customerTo: string,
  replyToCustomer?: string
): OutboundEmail[] {
  const config = getEmailRuntimeConfig();
  return [
    {
      to: customerTo,
      subject: customer.subject,
      html: customer.html,
      text: customer.text,
      replyTo: config.replyTo,
      tags: { kind, audience: 'customer' },
    },
    {
      to: config.adminAddress,
      subject: admin.subject,
      html: admin.html,
      text: admin.text,
      replyTo: replyToCustomer || config.replyTo,
      tags: { kind, audience: 'admin' },
    },
  ];
}

export async function dispatchContactEmails(input: ContactEmailInput, correlationId?: string): Promise<void> {
  const customer = renderContactEmail('customer', input);
  const admin = renderContactEmail('admin', input);
  await sendTransactionalEmails(
    pair('contact', customer, admin, input.email, input.email),
    correlationId
  );
}

export async function dispatchNewsletterEmails(input: NewsletterEmailInput, correlationId?: string): Promise<void> {
  const customer = renderNewsletterEmail('customer', input);
  const admin = renderNewsletterEmail('admin', input);
  await sendTransactionalEmails(pair('newsletter', customer, admin, input.email), correlationId);
}

export async function dispatchAccountEmails(input: AccountEmailInput, correlationId?: string): Promise<void> {
  const customer = renderAccountEmail('customer', input);
  const admin = renderAccountEmail('admin', input);
  await sendTransactionalEmails(pair('account', customer, admin, input.email), correlationId);
}

export async function dispatchOrderEventEmails(
  type: NotificationType,
  order: Order,
  payment?: Payment,
  correlationId?: string
): Promise<void> {
  const customer = renderOrderEmail(type, 'customer', order, payment);
  const admin = renderOrderEmail(type, 'admin', order, payment);
  await sendTransactionalEmails(pair(`order_${type.toLowerCase()}`, customer, admin, order.customerEmail), correlationId);
}

export async function dispatchOrderCreatedEmails(order: Order, payment?: Payment, correlationId?: string): Promise<void> {
  const events: NotificationType[] =
    order.status === 'PAYMENT_SUBMITTED' || Boolean(order.paymentProofReference)
      ? ['ORDER_RECEIVED', 'PAYMENT_SUBMITTED']
      : ['ORDER_RECEIVED', 'PAYMENT_INSTRUCTIONS'];

  for (const type of events) {
    await dispatchOrderEventEmails(type, order, payment, correlationId);
  }
}

export async function dispatchInferredOrderEmails(
  order: Order,
  payment?: Payment,
  explicitType?: NotificationType,
  correlationId?: string
): Promise<void> {
  const type = explicitType || inferOrderNotificationType(order, payment);
  if (!type) return;
  await dispatchOrderEventEmails(type, order, payment, correlationId);
}
