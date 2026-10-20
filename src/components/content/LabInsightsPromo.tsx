import React from 'react';
import { BookOpen } from 'lucide-react';
import { AppLink } from '../ui/AppLink';
import { ROUTES } from '../../lib/routing';

interface LabInsightsPromoProps {
  variant?: 'home' | 'catalogue';
}

export const LabInsightsPromo: React.FC<LabInsightsPromoProps> = ({ variant = 'home' }) => {
  const isHome = variant === 'home';

  return (
    <section
      aria-labelledby="lab-insights-promo-heading"
      className={
        isHome
          ? 'mx-auto max-w-7xl px-4 sm:px-8 lg:px-10'
          : 'rounded-xl border border-blue-100 bg-blue-50/40 p-5 sm:p-6'
      }
    >
      <div
        className={
          isHome
            ? 'flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8'
            : 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'
        }
      >
        <div className="max-w-xl">
          <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-[#4353FF] uppercase">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            Lab Insights
          </div>
          <h2
            id="lab-insights-promo-heading"
            className={`mt-2 font-mono font-bold text-slate-900 ${isHome ? 'text-xl sm:text-2xl' : 'text-lg'}`}
          >
            Research articles for UK laboratories
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Compound context, documentation, and compliant buying guides — written for in-vitro research, with links to
            live catalogue SKUs. Useful for AI summaries and researcher orientation; not medical advice.
          </p>
        </div>
        <AppLink
          href={ROUTES.insights}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#4353FF] px-5 py-2.5 font-mono text-xs font-bold tracking-wider text-white uppercase hover:bg-[#3644d9]"
        >
          Read Lab Insights →
        </AppLink>
      </div>
    </section>
  );
};
