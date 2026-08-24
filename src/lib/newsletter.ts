import { ContactEnquiry, NewsletterSubscription, NewsletterTopic } from '../types';

const NEWSLETTER_KEY = 'rpuk.newsletterSubscriptions';
const CONTACT_KEY = 'rpuk.contactEnquiries';

export const NEWSLETTER_TOPIC_OPTIONS: Array<{ id: NewsletterTopic; label: string }> = [
  { id: 'NEW_CATALOGUE', label: 'New catalogue items' },
  { id: 'RESTOCKS', label: 'Restocks' },
  { id: 'DOCUMENTATION', label: 'Documentation updates' },
  { id: 'OPERATIONS', label: 'Operational announcements' },
  { id: 'RESEARCH_RESOURCES', label: 'Research resources' },
  { id: 'PROMOTIONS', label: 'Promotions (optional)' },
];

function readJsonArray<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function loadNewsletterSubscriptions(): NewsletterSubscription[] {
  return readJsonArray<NewsletterSubscription>(NEWSLETTER_KEY);
}

export function subscribeToResearchUpdates(input: {
  email: string;
  topics: NewsletterTopic[];
  marketingConsent: boolean;
}): { ok: boolean; reason?: string; subscription?: NewsletterSubscription } {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return { ok: false, reason: 'Enter a valid email address.' };
  }
  if (!input.marketingConsent) {
    return { ok: false, reason: 'Consent is required before we can store a subscription.' };
  }

  const subscription: NewsletterSubscription = {
    id: `nl-${Date.now()}`,
    email,
    topics: input.topics.length > 0 ? input.topics : ['NEW_CATALOGUE', 'DOCUMENTATION'],
    marketingConsent: true,
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    const existing = loadNewsletterSubscriptions().filter((item) => item.email !== email);
    window.localStorage.setItem(NEWSLETTER_KEY, JSON.stringify([subscription, ...existing]));
  }

  return { ok: true, subscription };
}

export function loadContactEnquiries(): ContactEnquiry[] {
  return readJsonArray<ContactEnquiry>(CONTACT_KEY);
}

export function submitContactEnquiry(input: {
  name: string;
  email: string;
  message: string;
  consent: boolean;
}): { ok: boolean; reason?: string; enquiry?: ContactEnquiry } {
  if (!input.consent) {
    return { ok: false, reason: 'Consent is required before we can store this enquiry locally.' };
  }
  if (!input.name.trim() || !input.email.trim() || !input.message.trim()) {
    return { ok: false, reason: 'Name, email, and message are required.' };
  }

  const enquiry: ContactEnquiry = {
    id: `enq-${Date.now()}`,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    message: input.message.trim(),
    consent: true,
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    const existing = loadContactEnquiries();
    window.localStorage.setItem(CONTACT_KEY, JSON.stringify([enquiry, ...existing].slice(0, 25)));
  }

  return { ok: true, enquiry };
}
