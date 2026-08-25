/**
 * Research Peptides UK — Security Hardening, Input Sanitization & Authorization Guard Engine
 *
 * Implements:
 * 1. Request parameter & mutation validation
 * 2. HTML/XSS input sanitization
 * 3. Insecure Direct Object Reference (IDOR) prevention
 * 4. Document access control (PUBLIC, CUSTOMER_ONLY, ADMIN_ONLY)
 * 5. File upload validation (MIME, extension, size)
 * 6. Production HTTP Security Headers configuration
 */

import { Order, ProductDocument, User } from '../types';

export interface ValidationResult<T = unknown> {
  isValid: boolean;
  errors: string[];
  data?: T;
}

/**
 * Strips dangerous HTML tags and scripts to prevent stored and reflected XSS
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/onload\s*=/gi, '')
    .replace(/onerror\s*=/gi, '')
    .replace(/onclick\s*=/gi, '');
}

/**
 * Validates quantity inputs during cart mutation or inventory adjustment
 */
export function validateQuantity(quantity: unknown, min = 1, max = 999): ValidationResult<number> {
  const errors: string[] = [];
  const num = Number(quantity);

  if (isNaN(num) || !Number.isInteger(num)) {
    errors.push('Quantity must be an integer.');
  } else if (num < min) {
    errors.push(`Quantity cannot be less than ${min}.`);
  } else if (num > max) {
    errors.push(`Quantity cannot exceed maximum allowable limit of ${max}.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? num : undefined,
  };
}

/**
 * Validates email addresses
 */
export function validateEmail(email: string): ValidationResult<string> {
  const errors: string[] = [];
  const trimmed = (email || '').trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!trimmed) {
    errors.push('Email address is required.');
  } else if (!emailRegex.test(trimmed)) {
    errors.push('Invalid email address format.');
  } else if (trimmed.length > 254) {
    errors.push('Email address length exceeds maximum limit.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? trimmed.toLowerCase() : undefined,
  };
}

/**
 * Validates postal addresses to prevent injection and malformed deliveries
 */
export function validateShippingAddress(addr: Record<string, string>): ValidationResult<Record<string, string>> {
  const errors: string[] = [];
  if (!addr.fullName || addr.fullName.trim().length < 2) errors.push('Full name is required (min 2 characters).');
  if (!addr.addressLine1 || addr.addressLine1.trim().length < 3) errors.push('Address Line 1 is required.');
  if (!addr.city || addr.city.trim().length < 2) errors.push('City is required.');
  if (!addr.postcode || addr.postcode.trim().length < 3) errors.push('Valid postal code is required.');
  if (!addr.country || addr.country.trim().length < 2) errors.push('Country code is required.');

  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(addr)) {
    sanitized[key] = sanitizeHtml(String(value).trim());
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? sanitized : undefined,
  };
}

/**
 * IDOR Prevention: Verifies whether a user has authority to access an order record
 */
export function authorizeOrderAccess(order: Order, user?: User | null): { allowed: boolean; reason?: string } {
  if (!user) {
    return { allowed: false, reason: 'Authentication required to inspect order.' };
  }

  // Admins & Analysts have global administrative authority
  if (user.role === 'ADMIN' || user.role === 'ANALYST') {
    return { allowed: true };
  }

  // Customer must match order's customerId or email
  const isOwner =
    (order.customerId && order.customerId === user.id) ||
    (order.customerEmail || '').toLowerCase() === (user.email || '').toLowerCase();

  if (isOwner) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'IDOR_REJECTED: User lacks authority to access the requested order.',
  };
}

/**
 * Document Access Control: Verifies whether user can view/download a technical document
 */
export function authorizeDocumentAccess(
  doc: ProductDocument,
  user?: User | null
): { allowed: boolean; reason?: string } {
  if (doc.visibility === 'PUBLIC') {
    return { allowed: true };
  }

  if (doc.visibility === 'CUSTOMER_ONLY') {
    if (user && user.role) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'DOCUMENT_RESTRICTED: Please sign into your laboratory customer account to view this technical document.',
    };
  }

  if (doc.visibility === 'ADMIN_ONLY') {
    if (user && (user.role === 'ADMIN' || user.role === 'ANALYST')) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'DOCUMENT_CONFIDENTIAL: This analytical document is restricted to authorized administrative personnel.',
    };
  }

  return { allowed: false, reason: 'Access denied.' };
}

/**
 * Validates document and image uploads
 */
export function validateFileUpload(file: {
  name: string;
  size: number;
  type: string;
}): ValidationResult {
  const errors: string[] = [];
  const maxSizeBytes = 10 * 1024 * 1024; // 10MB

  const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.csv'];
  const allowedMimeTypes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'text/csv',
    'application/vnd.ms-excel',
  ];

  const ext = '.' + file.name.split('.').pop()?.toLowerCase();

  if (file.size > maxSizeBytes) {
    errors.push(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds 10MB limit.`);
  }

  if (!allowedExtensions.includes(ext)) {
    errors.push(`File extension "${ext}" is not permitted. Permitted extensions: ${allowedExtensions.join(', ')}`);
  }

  if (!allowedMimeTypes.includes(file.type.toLowerCase())) {
    errors.push(`MIME type "${file.type}" is not an authorized document type.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Production Security Headers Configuration
 */
export const PRODUCTION_SECURITY_HEADERS = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https:; frame-ancestors 'self';",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};
