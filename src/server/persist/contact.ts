import { and, eq, gte, sql } from 'drizzle-orm';
import { getReadyDb } from '../../db/index';
import { contactMessages } from '../../db/schema';

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

export async function createContactMessage(params: {
  name: string;
  email: string;
  subject?: string;
  message: string;
  consent: boolean;
  idempotencyKey?: string;
  ipHash?: string;
}): Promise<{ record: ContactRecord; duplicate: boolean }> {
  const db = await getReadyDb();
  if (!db) throw new Error('DATABASE_UNAVAILABLE');

  if (params.idempotencyKey) {
    const [existing] = await db
      .select()
      .from(contactMessages)
      .where(eq(contactMessages.idempotencyKey, params.idempotencyKey))
      .limit(1);
    if (existing) {
      return {
        duplicate: true,
        record: mapRow(existing),
      };
    }
  }

  if (params.ipHash) {
    const windowStart = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await db
      .select({ count: sql<number>`count(*)` })
      .from(contactMessages)
      .where(and(eq(contactMessages.ipHash, params.ipHash), gte(contactMessages.createdAt, windowStart)));
    const count = Number(recent[0]?.count || 0);
    if (count >= 8) {
      throw new Error('RATE_LIMITED');
    }
  }

  const now = new Date();
  const id = `enq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await db.insert(contactMessages).values({
    id,
    name: params.name,
    email: params.email,
    subject: params.subject || 'Operations enquiry',
    message: params.message,
    consent: params.consent,
    status: 'NEW',
    idempotencyKey: params.idempotencyKey,
    ipHash: params.ipHash,
    createdAt: now,
    updatedAt: now,
  });

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

function mapRow(row: typeof contactMessages.$inferSelect): ContactRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    subject: row.subject || undefined,
    message: row.message,
    consent: row.consent,
    status: row.status as ContactStatus,
    createdAt: row.createdAt.toISOString(),
  };
}
