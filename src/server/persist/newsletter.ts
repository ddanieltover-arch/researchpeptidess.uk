import { eq } from 'drizzle-orm';
import { getReadyDb } from '../../db/index';
import { newsletterSubscriptions } from '../../db/schema';
import { isEmailProviderConnected } from '../env-status';

export interface NewsletterRecord {
  id: string;
  email: string;
  topics: string[];
  consentTimestamp: string;
  consentSource: string;
  status: string;
  unsubscribeStatus: string;
  providerStatus: string;
}

export async function upsertNewsletterSubscription(params: {
  email: string;
  topics: string[];
  consentSource: string;
}): Promise<{ record: NewsletterRecord; created: boolean }> {
  const db = await getReadyDb();
  if (!db) throw new Error('DATABASE_UNAVAILABLE');

  const email = params.email.trim().toLowerCase();
  const now = new Date();
    const providerStatus = isEmailProviderConnected()
      ? 'CONNECTED'
      : 'NOT_CONNECTED_TO_EMAIL_PROVIDER';

  const [existing] = await db
    .select()
    .from(newsletterSubscriptions)
    .where(eq(newsletterSubscriptions.email, email))
    .limit(1);

  if (existing) {
    await db
      .update(newsletterSubscriptions)
      .set({
        topics: JSON.stringify(params.topics),
        consentTimestamp: now,
        consentSource: params.consentSource,
        status: 'ACTIVE',
        unsubscribeStatus: 'SUBSCRIBED',
        providerStatus,
        updatedAt: now,
      })
      .where(eq(newsletterSubscriptions.email, email));
    return {
      created: false,
      record: {
        id: existing.id,
        email,
        topics: params.topics,
        consentTimestamp: now.toISOString(),
        consentSource: params.consentSource,
        status: 'ACTIVE',
        unsubscribeStatus: 'SUBSCRIBED',
        providerStatus,
      },
    };
  }

  const id = `nl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await db.insert(newsletterSubscriptions).values({
    id,
    email,
    topics: JSON.stringify(params.topics),
    consentTimestamp: now,
    consentSource: params.consentSource,
    status: 'ACTIVE',
    unsubscribeStatus: 'SUBSCRIBED',
    providerStatus,
    createdAt: now,
    updatedAt: now,
  });

  return {
    created: true,
    record: {
      id,
      email,
      topics: params.topics,
      consentTimestamp: now.toISOString(),
      consentSource: params.consentSource,
      status: 'ACTIVE',
      unsubscribeStatus: 'SUBSCRIBED',
      providerStatus,
    },
  };
}
