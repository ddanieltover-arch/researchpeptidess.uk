/**
 * Research Peptides UK — Notification & Communication Service Abstraction
 * Generates audit-ready institutional notifications across the order & payment lifecycle.
 * Decoupled from physical email providers (e.g. Resend, Postmark, SES, SMTP).
 */

import { Order, Payment, OrderNotification, NotificationType } from '../types';
import { orderEmailPlainSummary } from './email/templates';

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
  return orderEmailPlainSummary(type, order, payment);
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

  provider.send(notification).catch((err) => {
    console.error('Notification dispatch error:', err);
  });

  return notification;
}
