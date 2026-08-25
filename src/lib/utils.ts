import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency: 'GBP' | 'EUR' = 'GBP'): string {
  const symbol = currency === 'GBP' ? '£' : '€';
  const rate = currency === 'EUR' ? 1.18 : 1.0;
  const numeric = Number(amount);
  const converted = (Number.isFinite(numeric) ? numeric : 0) * rate;
  return `${symbol}${converted.toFixed(2)}`;
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function generateOrderNumber(): string {
  const prefix = 'RP-UK';
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${random}`;
}
