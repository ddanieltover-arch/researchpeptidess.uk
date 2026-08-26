/**
 * Converts untrusted values into a string React can render.
 * API/database payloads sometimes leak `{ code, message }` objects into JSX.
 */
export function isPlainDataObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  if ('$$typeof' in value) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function toRenderableText(value: unknown): string {
  if (value == null || typeof value === 'boolean') return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') {
    return Number.isFinite(Number(value)) || typeof value === 'bigint' ? String(value) : '';
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString();
  }
  if (typeof value === 'object') {
    const record = value as { message?: unknown; error?: unknown; code?: unknown };
    const nestedError = record.error;
    if (typeof nestedError === 'string' && nestedError.trim()) return nestedError;
    if (isPlainDataObject(nestedError)) return toRenderableText(nestedError);

    const message = record.message;
    if (typeof message === 'string' && message.trim()) {
      const code = record.code;
      if (typeof code === 'string' || typeof code === 'number') {
        return `${code}: ${message}`;
      }
      return message;
    }
    if (isPlainDataObject(message)) return toRenderableText(message);

    try {
      const json = JSON.stringify(value);
      return json && json !== '{}' ? json : '';
    } catch {
      return '';
    }
  }
  return String(value);
}
