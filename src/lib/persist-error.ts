export type PersistStage =
  | 'request_validation'
  | 'database_connection'
  | 'schema_ensure'
  | 'idempotency_lookup'
  | 'order_insert'
  | 'order_items_insert'
  | 'payment_insert'
  | 'inventory_reservation'
  | 'audit'
  | 'read';

export type PersistClassification =
  | 'VALIDATION'
  | 'DATABASE_UNAVAILABLE'
  | 'CONNECTION'
  | 'SCHEMA_MISSING'
  | 'CONSTRAINT'
  | 'UNKNOWN';

export class PersistStageError extends Error {
  readonly stage: PersistStage;
  readonly classification: PersistClassification;

  constructor(stage: PersistStage, classification: PersistClassification, message: string) {
    super(message);
    this.name = 'PersistStageError';
    this.stage = stage;
    this.classification = classification;
  }
}

export function classifyPersistError(error: unknown): {
  classification: PersistClassification;
  stage: PersistStage | 'unknown';
} {
  if (error instanceof PersistStageError) {
    return { classification: error.classification, stage: error.stage };
  }
  const message = error instanceof Error ? error.message : String(error);
  if (message === 'DATABASE_UNAVAILABLE') {
    return { classification: 'DATABASE_UNAVAILABLE', stage: 'database_connection' };
  }
  if (/does not exist|undefined_table|undefined_column|42703|42P01/i.test(message)) {
    return { classification: 'SCHEMA_MISSING', stage: 'schema_ensure' };
  }
  if (/channel_binding|ECONN|ENOTFOUND|ETIMEDOUT|fetch failed|timeout|aborted/i.test(message)) {
    return { classification: 'CONNECTION', stage: 'database_connection' };
  }
  if (/unique|duplicate|23505|foreign key|23503/i.test(message)) {
    return { classification: 'CONSTRAINT', stage: 'order_insert' };
  }
  return { classification: 'UNKNOWN', stage: 'unknown' };
}

export function recommendedPersistFix(classification: PersistClassification): string {
  switch (classification) {
    case 'SCHEMA_MISSING':
      return 'Apply additive commerce migrations (orders, payments, inventory) on the production database.';
    case 'CONNECTION':
      return 'Verify the Neon HTTP connection string and remove libpq-only options such as channel_binding.';
    case 'DATABASE_UNAVAILABLE':
      return 'Set DATABASE_URL or the Neon POSTGRES_URL alias on the production Vercel project.';
    case 'CONSTRAINT':
      return 'Inspect unique/foreign-key constraints for the failing order insert.';
    case 'VALIDATION':
      return 'Send an order payload that includes order.id and payment.id.';
    default:
      return 'Inspect sanitized server logs for the correlation ID and failing stage.';
  }
}
