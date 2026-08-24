import React, { useState } from 'react';
import { submitContactRequest } from '../../lib/persistence-api';
import { Button } from '../ui/Button';
import { useStore } from '../../context/StoreContext';

export const ContactEnquiryForm: React.FC = () => {
  const { addToast, storeSettings } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await submitContactRequest({
      name,
      email,
      message,
      consent,
      idempotencyKey: `${email.trim().toLowerCase()}:${message.trim().slice(0, 80)}`,
    });
    if (!result.ok) {
      addToast(
        'error',
        'Enquiry not stored',
        result.reference ? `${result.reason || 'Please complete the form.'} Reference: ${result.reference}` : result.reason || 'Please complete the form.'
      );
      return;
    }
    addToast(
      'success',
      'Enquiry received',
      `Your message was stored for operations follow-up. You can also email ${storeSettings.supportEmail}.`
    );
    setName('');
    setEmail('');
    setMessage('');
    setConsent(false);
  };

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-3 rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="font-mono text-sm font-bold text-slate-900">Contact form</h3>
      <p className="text-xs text-slate-600">
        This form stores your enquiry on the server with consent. It does not claim a response time.
      </p>
      <input
        required
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Name"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
      />
      <input
        required
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
      />
      <textarea
        required
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="How can the operations team help?"
        rows={5}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
      />
      <label className="flex items-start gap-2 text-[11px] text-slate-700">
        <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5" />
        I consent to Research Peptides UK storing this enquiry so the support team can respond.
      </label>
      <Button type="submit" variant="primary" size="sm">
        Send enquiry
      </Button>
    </form>
  );
};
