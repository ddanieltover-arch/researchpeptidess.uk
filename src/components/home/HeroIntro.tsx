import React from 'react';
import { ArrowRight, Check, FileText, ShoppingBag, Star } from 'lucide-react';
import { AppLink } from '../ui/AppLink';
import { ROUTES } from '../../lib/routing';

const TRUST_AVATARS = [
  { initials: 'JD', className: 'z-30 bg-[#3B5BDB]' },
  { initials: 'SK', className: 'z-20 -ml-2 bg-[#8B7CF6]' },
  { initials: 'RM', className: 'z-10 -ml-2 bg-[#34D399]' },
] as const;

const FEATURE_PILLS = ['99%+ HPLC Purity', 'COA Available', 'Royal Mail Tracked'] as const;

export const HeroIntro: React.FC = () => {
  return (
    <div className="max-w-xl lg:max-w-[34rem]">
      <div className="mb-6 inline-flex max-w-full flex-wrap items-center gap-2.5 rounded-full border border-slate-200/90 bg-white px-3 py-1.5 shadow-sm">
        <div className="flex items-center" aria-hidden="true">
          {TRUST_AVATARS.map((avatar) => (
            <span
              key={avatar.initials}
              className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white ${avatar.className}`}
            >
              {avatar.initials}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex text-amber-400" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} className="h-3.5 w-3.5 fill-amber-400" />
            ))}
          </span>
          <p className="text-[13px] leading-none text-slate-500">
            <span className="font-bold text-slate-900">4.9/5</span>
            <span> · 2,400+ UK researchers</span>
          </p>
        </div>
      </div>

      <h1 className="font-sans tracking-tight">
        <span className="block text-[1.65rem] font-semibold text-slate-500 sm:text-3xl lg:text-[2.15rem]">
          The UK Standard for
        </span>
        <span className="mt-1 block text-[2.75rem] leading-[0.95] font-extrabold text-[#3B5BFF] drop-shadow-[0_8px_24px_rgba(59,91,255,0.28)] sm:text-6xl lg:text-[4.25rem]">
          Research-Grade
        </span>
        <span className="block text-[2.75rem] leading-[0.95] font-extrabold text-[#0B132B] drop-shadow-[0_8px_18px_rgba(15,23,42,0.12)] sm:text-6xl lg:text-[4.25rem]">
          Peptides
        </span>
      </h1>

      <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-slate-500 sm:text-lg">
        Premium British research peptides independently verified to{' '}
        <strong className="font-semibold text-slate-700">99%+ HPLC purity</strong> — dispatched same-day from
        the UK with full COA available on request.
      </p>

      <ul className="mt-5 flex flex-wrap gap-2">
        {FEATURE_PILLS.map((label) => (
          <li
            key={label}
            className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/90 bg-white px-3 py-1.5 text-[13px] font-medium text-[#4353FF]"
          >
            <Check className="h-3.5 w-3.5 text-[#7C6FF0]" strokeWidth={2.75} aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <AppLink
          href={ROUTES.peptides}
          className="inline-flex min-h-12 items-center gap-2.5 rounded-xl bg-[#3B5BFF] px-5 py-3 text-[15px] font-semibold text-white shadow-md shadow-blue-600/25 hover:bg-[#2F4AE6]"
        >
          <ShoppingBag className="h-4 w-4" aria-hidden="true" />
          Shop Peptides
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </AppLink>
        <AppLink
          href="/quality"
          className="inline-flex min-h-12 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-5 py-3 text-[15px] font-semibold text-[#0B132B] hover:border-slate-300 hover:bg-slate-50"
        >
          <FileText className="h-4 w-4 text-slate-700" aria-hidden="true" />
          View COA
        </AppLink>
      </div>
    </div>
  );
};
