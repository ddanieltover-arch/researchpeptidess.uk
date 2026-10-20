import React from 'react';
import { AppLink } from '../ui/AppLink';
import { HomeUkBuyerTopic } from '../../lib/uk-buyer-seo';

export interface UkBuyerQuestionsPanelProps {
  id?: string;
  eyebrow?: string;
  title: string;
  intro?: string;
  topics: HomeUkBuyerTopic[];
  variant?: 'light' | 'home' | 'cms';
}

export const UkBuyerQuestionsPanel: React.FC<UkBuyerQuestionsPanelProps> = ({
  id = 'uk-buyer-questions',
  eyebrow = 'UK buyers',
  title,
  intro,
  topics,
  variant = 'light',
}) => {
  const shellClass =
    variant === 'home'
      ? 'border-y border-slate-200 bg-[#F7F8FC] py-14'
      : variant === 'cms'
        ? 'rounded-2xl border border-stone-200 bg-stone-50 p-6 sm:p-8'
        : 'rounded-xl border border-slate-200 bg-slate-50/80 p-6 md:p-8';

  return (
    <section id={id} aria-labelledby={`${id}-heading`} className={shellClass}>
      <div className={variant === 'home' ? 'mx-auto max-w-7xl px-4 sm:px-8 lg:px-10' : undefined}>
        <span className="block font-mono text-xs font-bold tracking-widest text-[#4353FF] uppercase">{eyebrow}</span>
        <h2 id={`${id}-heading`} className="mt-2 font-mono text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
          {title}
        </h2>
        {intro && <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">{intro}</p>}

        <dl className={`mt-8 grid gap-6 ${variant === 'home' ? 'md:grid-cols-2' : 'md:grid-cols-2'}`}>
          {topics.map((item) => (
            <div
              key={item.question}
              className={
                variant === 'cms'
                  ? 'rounded-xl border border-stone-200 bg-white p-4'
                  : 'rounded-xl border border-slate-200 bg-white p-5 shadow-2xs'
              }
            >
              <dt className="font-mono text-sm font-bold text-slate-900">{item.question}</dt>
              <dd className="mt-2 text-xs leading-relaxed text-slate-600">{item.answer}</dd>
              {item.href && item.linkLabel && (
                <AppLink
                  href={item.href}
                  className="mt-3 inline-flex font-mono text-[11px] font-bold tracking-wide text-[#4353FF] uppercase hover:text-[#2F4AE6]"
                >
                  {item.linkLabel} →
                </AppLink>
              )}
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};
