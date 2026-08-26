import { asIso, requireNeonSql } from '../neon-sql';

export type ContactStatus = 'NEW' | 'IN_REVIEW' | 'RESPONDED' | 'CLOSED' | 'SPAM';

export interface ContactRecord {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  consent: boolean;
  status: ContactStatus;
  createdAt: string;
}

function mapRow(row: Record<string, unknown>): ContactRecord {
  return {
    id: String(row.id || ''),
    name: String(row.name || ''),
    email: String(row.email || ''),
    subject: row.subject ? String(row.subject) : undefined,
    message: String(row.message || ''),
    consent: Boolean(row.consent),
    status: (row.status as ContactStatus) || 'NEW',
    createdAt: asIso(row.created_at),
  };
}

export async function createContactMessage(params: {
  name: string;
  email: string;
  subject?: string;
  message: string;
  consent: boolean;
  idempotencyKey?: string;
  ipHash?: string;
}): Promise<{ record: ContactRecord; duplicate: boolean }> {
  const sql = requireNeonSql();

  if (params.idempotencyKey) {
    const existing = await sql`
      SELECT id, name, email, subject, message, consent, status, created_at
      FROM contact_messages
      WHERE idempotency_key = ${params.idempotencyKey}
      LIMIT 1
    `;
    if (existing[0]) {
      return { duplicate: true, record: mapRow(existing[0] as Record<string, unknown>) };
    }
  }

  if (params.ipHash) {
    const windowStart = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await sql`
      SELECT count(*)::int AS count
      FROM contact_messages
      WHERE ip_hash = ${params.ipHash}
        AND created_at >= ${windowStart}
    `;
    const count = Number((recent[0] as { count?: number } | undefined)?.count || 0);
    if (count >= 8) {
      throw new Error('RATE_LIMITED');
    }
  }

  const now = new Date();
  const id = `enq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const subject = params.subject || 'Operations enquiry';
  await sql`
    INSERT INTO contact_messages (
      id, name, email, subject, message, consent, status, idempotency_key, ip_hash, created_at, updated_at
    ) VALUES (
      ${id},
      ${params.name},
      ${params.email},
      ${subject},
      ${params.message},
      ${params.consent},
      ${'NEW'},
      ${params.idempotencyKey ?? null},
      ${params.ipHash ?? null},
      ${now},
      ${now}
    )
  `;

  return {
    duplicate: false,
    record: {
      id,
      name: params.name,
      email: params.email,
      subject: params.subject,
      message: params.message,
      consent: params.consent,
      status: 'NEW',
      createdAt: now.toISOString(),
    },
  };
}
