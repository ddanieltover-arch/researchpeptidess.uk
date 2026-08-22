/**
 * Research Peptides UK — Observability, Error Monitoring & Request Correlation Engine
 *
 * Implements:
 * 1. Request correlation ID generator (req_corr_xxx) to trace checkout -> order -> payment -> inventory.
 * 2. Safe error logger with automatic sensitive data redaction.
 * 3. Log buffering and telemetry for administrative inspection and incident diagnosis.
 */

import { ObservabilityLogEntry, LogLevel, UserRole } from '../types';

let logBuffer: ObservabilityLogEntry[] = [];

/**
 * Generates a unique, high-entropy request correlation ID
 */
export function generateCorrelationId(prefix = 'req'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_corr_${timestamp}_${random}`;
}

/**
 * Sanitizes log payloads to eliminate sensitive authentication tokens and financial secrets
 */
function sanitizeLogPayload(payload?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!payload) return undefined;
  const sanitized: Record<string, unknown> = {};
  const sensitiveKeys = [
    'password',
    'password_hash',
    'token',
    'auth_secret',
    'private_key',
    'wallet_key',
    'secret',
    'cvv',
    'card_number',
    'sort_code',
    'account_number',
  ];

  for (const [key, value] of Object.entries(payload)) {
    const isSensitive = sensitiveKeys.some((s) => key.toLowerCase().includes(s));
    if (isSensitive) {
      sanitized[key] = '[REDACTED_SENSITIVE_SECRET]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeLogPayload(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Records a structured observability log entry
 */
export function recordLog(entry: {
  level: LogLevel;
  route: string;
  operation: string;
  message: string;
  correlationId?: string;
  userRole?: UserRole | 'SYSTEM' | 'GUEST';
  details?: Record<string, unknown>;
}): ObservabilityLogEntry {
  const logItem: ObservabilityLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    correlationId: entry.correlationId || generateCorrelationId(),
    timestamp: new Date().toISOString(),
    level: entry.level,
    route: entry.route,
    operation: entry.operation,
    message: entry.message,
    userRole: entry.userRole || 'GUEST',
    details: sanitizeLogPayload(entry.details),
  };

  logBuffer.unshift(logItem);
  if (logBuffer.length > 500) {
    logBuffer = logBuffer.slice(0, 500);
  }

  // Console output in dev/preview
  if (entry.level === 'ERROR' || entry.level === 'FATAL') {
    console.error(`[OBSERVABILITY ${entry.level}] [${logItem.correlationId}] ${entry.route} - ${entry.operation}: ${entry.message}`, logItem.details);
  } else if (entry.level === 'WARN') {
    console.warn(`[OBSERVABILITY WARN] [${logItem.correlationId}] ${entry.route} - ${entry.operation}: ${entry.message}`, logItem.details);
  }

  return logItem;
}

/**
 * Captures an unhandled error or exception safely
 */
export function captureException(
  error: unknown,
  context: {
    route: string;
    operation: string;
    correlationId?: string;
    userRole?: UserRole | 'SYSTEM' | 'GUEST';
    details?: Record<string, unknown>;
  }
): ObservabilityLogEntry {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  return recordLog({
    level: 'ERROR',
    route: context.route,
    operation: context.operation,
    message: errorMessage,
    correlationId: context.correlationId,
    userRole: context.userRole,
    details: {
      ...context.details,
      stack: stack ? stack.split('\n').slice(0, 5).join('\n') : undefined,
    },
  });
}

/**
 * Retrieves the current in-memory log buffer
 */
export function getObservabilityLogs(): ObservabilityLogEntry[] {
  return [...logBuffer];
}

/**
 * Clears the log buffer (for tests)
 */
export function clearObservabilityLogs(): void {
  logBuffer = [];
}
