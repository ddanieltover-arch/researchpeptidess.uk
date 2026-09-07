import { MailOrder, MailPayment } from './blocks';
import { OrderMailKind, renderOrderEmail } from './order-templates';
import { sendRenderedPair } from './send';

export async function dispatchOrderCreatedEmails(
  order: MailOrder,
  payment?: MailPayment,
  reference?: string
): Promise<void> {
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
  order: MailOrder,
  payment?: MailPayment
): Promise<void> {
  const customer = renderOrderEmail(kind, 'customer', order, payment);
  const admin = renderOrderEmail(kind, 'admin', order, payment);
  await sendRenderedPair(order.customerEmail, customer, admin, `order_${kind.toLowerCase()}`);
}
