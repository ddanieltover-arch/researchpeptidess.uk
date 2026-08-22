/**
 * Research Peptides UK — Notification & Communication Service Abstraction
 * Generates audit-ready institutional notifications across the order & payment lifecycle.
 * Decoupled from physical email providers (e.g. Resend, Postmark, SES, SMTP).
 */

import { Order, Payment, OrderNotification, NotificationType } from '../types';

export interface NotificationProvider {
  name: string;
  isLive: boolean;
  send: (notification: OrderNotification) => Promise<{ success: boolean; messageId?: string; error?: string }>;
}

/**
 * Standard Simulated / Logged Provider for local and staging container environments.
 */
export const LocalAuditNotificationProvider: NotificationProvider = {
  name: 'Local Institutional Dispatch Logger',
  isLive: false,
  send: async (notification: OrderNotification) => {
    // In demo/test mode, recorded into the state log without pretending external SMTP delivery
    console.log(
      `[Laboratory Notification Dispatched] Type: ${notification.type} | To: ${notification.recipientEmail} | Subject: "${notification.subject}"`
    );
    return {
      success: true,
      messageId: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    };
  },
};

/**
 * Constructs institutional email content templates.
 */
export function buildNotificationContent(
  type: NotificationType,
  order: Order,
  payment?: Payment
): { subject: string; contentSummary: string } {
  const ref = order.orderNumber;

  switch (type) {
    case 'ORDER_RECEIVED':
      return {
        subject: `[RP-UK] Laboratory Requisition Confirmed: Order #${ref}`,
        contentSummary: `Requisition #${ref} for £${order.total.toFixed(
          2
        )} has been registered. Items are reserved in quarantine pending payment settlement.`,
      };

    case 'PAYMENT_INSTRUCTIONS':
      if (order.paymentMethod === 'BANK_TRANSFER') {
        return {
          subject: `[RP-UK] Faster Payments Settlement Instructions: Requisition #${ref}`,
          contentSummary: `Please remit £${order.total.toFixed(
            2
          )} using reference "${payment?.reference || ref}" to Research Peptides UK (Sort Code: 20-00-00, Acc: 83920194).`,
        };
      } else {
        return {
          subject: `[RP-UK] Cryptocurrency Settlement Details: Requisition #${ref}`,
          contentSummary: `5% crypto discount applied. Total due: £${order.total.toFixed(
            2
          )}. Remit to dedicated wallet address before reservation window expires.`,
        };
      }

    case 'PAYMENT_SUBMITTED':
      return {
        subject: `[RP-UK] Payment Audit Evidence Received: Requisition #${ref}`,
        contentSummary: `Payment reference/transaction hash for #${ref} has been submitted and queued for Finance Audit verification.`,
      };

    case 'PAYMENT_VERIFIED':
      return {
        subject: `[RP-UK] Settlement Verified & Cleared: Requisition #${ref}`,
        contentSummary: `Full settlement of £${order.total.toFixed(
          2
        )} verified by laboratory finance. Order moved to synthesis & QC packaging.`,
      };

    case 'PAYMENT_REJECTED':
      return {
        subject: `[RP-UK] Action Required: Payment Settlement Verification Unsuccessful #${ref}`,
        contentSummary: `The payment evidence provided for Requisition #${ref} could not be reconciled. Reason: ${
          payment?.rejectionReason || 'Statement reference mismatch'
        }. Please re-submit reference.`,
      };

    case 'ORDER_PROCESSING':
      return {
        subject: `[RP-UK] Compounds in Laboratory Preparation: Requisition #${ref}`,
        contentSummary: `Vials for #${ref} are undergoing quality inspection, vacuum packaging, and batch documentation verification.`,
      };

    case 'ORDER_SHIPPED':
      return {
        subject: `[RP-UK] Consignment Dispatched: Requisition #${ref} [Tracked]`,
        contentSummary: `Consignment #${ref} has been dispatched via ${order.courier || 'Royal Mail Tracked 24'}. Tracking Number: ${
          order.trackingNumber || 'Pending Courier Scan'
        }.`,
      };

    case 'ORDER_DELIVERED':
      return {
        subject: `[RP-UK] Consignment Delivery Confirmed: Requisition #${ref}`,
        contentSummary: `Consignment #${ref} has been delivered to ${order.shippingAddress.institution || order.shippingAddress.fullName}. Please store lyophilized vials at -20°C.`,
      };

    case 'ORDER_CANCELLED':
      return {
        subject: `[RP-UK] Requisition Cancelled: Order #${ref}`,
        contentSummary: `Requisition #${ref} has been cancelled. Any active inventory reservations have been released.`,
      };

    case 'REFUND_PROCESSED':
      return {
        subject: `[RP-UK] Settlement Refund Processed: Order #${ref}`,
        contentSummary: `A refund of £${order.total.toFixed(2)} has been recorded for Requisition #${ref}.`,
      };

    default:
      return {
        subject: `[RP-UK] Requisition Update: Order #${ref}`,
        contentSummary: `Requisition #${ref} status updated.`,
      };
  }
}

/**
 * Creates and logs a standardized OrderNotification.
 */
export function createOrderNotification(
  type: NotificationType,
  order: Order,
  payment?: Payment,
  provider: NotificationProvider = LocalAuditNotificationProvider
): OrderNotification {
  const { subject, contentSummary } = buildNotificationContent(type, order, payment);

  const notification: OrderNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    orderId: order.id,
    orderNumber: order.orderNumber,
    recipientEmail: order.customerEmail,
    recipientName: order.customerName,
    type,
    subject,
    contentSummary,
    status: provider.isLive ? 'SENT' : 'SIMULATED',
    dispatchedAt: new Date().toISOString(),
  };

  // Dispatch via provider asynchronously
  provider.send(notification).catch((err) => {
    console.error('Notification dispatch error:', err);
  });

  return notification;
}
