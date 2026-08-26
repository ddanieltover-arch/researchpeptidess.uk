import { Order } from '../types';

export function filterOrdersForCustomer(
  orders: Order[] | null | undefined,
  user: { id?: string; email?: string } | null | undefined
): Order[] {
  if (!Array.isArray(orders) || !user) return [];

  const email = typeof user.email === 'string' ? user.email.trim().toLowerCase() : '';
  const userId = user.id || '';

  return orders.filter((order) => {
    if (!order || typeof order !== 'object') return false;
    const orderEmail = typeof order.customerEmail === 'string' ? order.customerEmail.trim().toLowerCase() : '';
    const orderCustomerId = typeof order.customerId === 'string' ? order.customerId : '';
    return (Boolean(email) && orderEmail === email) || (Boolean(userId) && orderCustomerId === userId);
  });
}
