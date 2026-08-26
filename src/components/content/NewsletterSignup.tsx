import React, { useState } from 'react';
import { NEWSLETTER_TOPIC_OPTIONS } from '../../lib/newsletter';
import { submitNewsletterRequest } from '../../lib/persistence-api';
import { NewsletterTopic } from '../../types';
import { Button } from '../ui/Button';
import { toRenderableText } from '../../lib/react-text';

interface NewsletterSignupProps {
  variant?: 'light' | 'dark';
  heading?: string;
  description?: string;
}

export const NewsletterSignup: React.FC<NewsletterSignupProps> = ({
  variant = 'light',
  heading = 'Research Peptides UK Updates',
  description = 'Optional notices for new catalogue items, restocks, documentation updates, and operational announcements. We do not subscribe anyone without consent.',
}) => {
  const [email, setEmail] = useState('');
  const [topics, setTopics] = useState<NewsletterTopic[]>(['NEW_CATALOGUE', 'DOCUMENTATION', 'RESTOCKS']);
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDark = variant === 'dark';

  const toggleTopic = (topic: NewsletterTopic) => {
    setTopics((current) =>
      current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic]
    );
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await submitNewsletterRequest({ email, topics, consent });
    if (!result.ok) {
      setError(result.reason || 'Subscription could not be saved.');
      setMessage(null);
      return;
    }
    setError(null);
    setMessage(
      result.providerStatus === 'NOT_CONNECTED_TO_EMAIL_PROVIDER'
        ? 'Subscription stored. A confirmation email could not be sent because an email provider is not connected.'
        : 'Subscription stored. A confirmation email is on its way to this address.'
    );
    setEmail('');
    setConsent(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <h3 className={`text-sm font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{heading}</h3>
        {description ? (
          <p className={`mt-1 text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>
        ) : null}
      </div>
      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="researcher@institution.ac.uk"
        className={`w-full rounded-lg border px-3 py-2 text-xs ${
          isDark
            ? 'border-slate-700 bg-slate-900 text-white placeholder:text-slate-500'
            : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'
        }`}
      />
      <fieldset className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        <legend className={`mb-1 font-mono text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Topics
        </legend>
        {NEWSLETTER_TOPIC_OPTIONS.map((option) => (
          <label key={option.id} className={`flex items-center gap-2 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <input
              type="checkbox"
              checked={topics.includes(option.id)}
              onChange={() => toggleTopic(option.id)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      <label className={`flex items-start gap-2 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
        <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5" />
        I consent to Research Peptides UK storing this email for the selected update topics. A confirmation message will be sent to this address.
      </label>
      {error ? <p className="text-[11px] text-rose-500">{toRenderableText(error)}</p> : null}
      {message && <p className="text-[11px] text-emerald-500">{message}</p>}
      <Button type="submit" variant="primary" size="sm" className="w-full text-xs">
        Subscribe with consent
      </Button>
    </form>
  );
};
