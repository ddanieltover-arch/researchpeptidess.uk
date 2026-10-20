import React from 'react';
import { AppLink } from '../ui/AppLink';
import {
  CatalogueBuyerContext,
  getCatalogueUkBuyerTopics,
  HomeUkBuyerTopic,
} from '../../lib/uk-buyer-seo';

interface CatalogueUkBuyerQuestionsProps {
  context: CatalogueBuyerContext;
}

export const CatalogueUkBuyerQuestions: React.FC<CatalogueUkBuyerQuestionsProps> = ({ context }) => {
  const topics = getCatalogueUkBuyerTopics(context);

  const renderTopic = (topic: HomeUkBuyerTopic) => (
    <details
      key={topic.question}
      className="group rounded-lg border border-slate-200 bg-white px-4 py-3 open:shadow-xs"
    >
      <summary className="cursor-pointer list-none font-mono text-sm font-semibold text-slate-900 marker:content-none">
        <span className="flex items-start justify-between gap-3">
          {topic.question}
          <span className="text-[#4353FF] text-xs font-bold uppercase tracking-wider group-open:rotate-45">+</span>
        </span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{topic.answer}</p>
      {topic.href && topic.linkLabel ? (
        <AppLink href={topic.href} className="mt-2 inline-block text-sm font-semibold text-[#4353FF] hover:underline">
          {topic.linkLabel}
        </AppLink>
      ) : null}
    </details>
  );

  return (
    <section aria-labelledby="catalogue-uk-buyer-heading" className="space-y-4">
      <div>
        <h2 id="catalogue-uk-buyer-heading" className="font-mono text-lg font-bold text-slate-900">
          UK ordering questions
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Research-use catalogue only — not medical or personal-use guidance.
        </p>
      </div>
      <div className="space-y-2">{topics.map(renderTopic)}</div>
    </section>
  );
};
