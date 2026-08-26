import { isEmailProviderConnected } from '../env-status';
import { requireNeonSql } from '../neon-sql';

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
  const sql = requireNeonSql();
  const email = params.email.trim().toLowerCase();
  const now = new Date();
  const providerStatus = isEmailProviderConnected()
    ? 'CONNECTED'
    : 'NOT_CONNECTED_TO_EMAIL_PROVIDER';
  const topicsJson = JSON.stringify(params.topics);

  const existing = await sql`
    SELECT id FROM newsletter_subscriptions WHERE email = ${email} LIMIT 1
  `;
  const existingId = existing[0] ? String((existing[0] as { id: string }).id) : '';

  if (existingId) {
    await sql`
      UPDATE newsletter_subscriptions
      SET
        topics = ${topicsJson},
        consent_timestamp = ${now},
        consent_source = ${params.consentSource},
        status = ${'ACTIVE'},
        unsubscribe_status = ${'SUBSCRIBED'},
        provider_status = ${providerStatus},
        updated_at = ${now}
      WHERE email = ${email}
    `;
    return {
      created: false,
      record: {
        id: existingId,
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
  await sql`
    INSERT INTO newsletter_subscriptions (
      id, email, topics, consent_timestamp, consent_source, status, unsubscribe_status, provider_status, created_at, updated_at
    ) VALUES (
      ${id},
      ${email},
      ${topicsJson},
      ${now},
      ${params.consentSource},
      ${'ACTIVE'},
      ${'SUBSCRIBED'},
      ${providerStatus},
      ${now},
      ${now}
    )
  `;

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
