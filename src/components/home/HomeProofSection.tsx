import React from 'react';
import { Star } from 'lucide-react';
import { HomeFeatureTrust } from './HomeFeatureTrust';

const PROOF_STATS = [
  { value: '4.9/5', label: 'Customer Rating' },
  { value: '2,400+', label: 'Verified Reviews' },
  { value: '100%', label: 'Reorder Rate' },
  { value: 'VIP', label: 'Member Access' },
] as const;

const GoldStars: React.FC = () => (
  <span className="mb-2 flex justify-center gap-0.5 text-amber-400" aria-hidden="true">
    {Array.from({ length: 5 }).map((_, index) => (
      <Star key={index} className="h-3.5 w-3.5 fill-amber-400" />
    ))}
  </span>
);

export const HomeProofSection: React.FC = () => {
  return (
    <div className="mt-20 sm:mt-24">
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 px-3.5 py-1 text-[11px] font-semibold tracking-[0.16em] text-[#5B4CFF] uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-[#5B4CFF]" aria-hidden="true" />
          Trusted UK supplier since 2018
        </p>
        <h2 className="text-3xl font-extrabold tracking-tight text-[#0B132B] sm:text-5xl">
          Best Place to Buy <span className="text-[#5B4CFF]">British</span> Peptides in UK
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
          Independently verified research peptides dispatched same-day from the United Kingdom. Quality you can trust,
          service you&apos;ll rely on.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-5xl rounded-2xl border border-slate-200 bg-white px-2 py-6 shadow-lg shadow-slate-900/10 sm:px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {PROOF_STATS.map((stat, index) => (
            <div
              key={stat.label}
              className={`px-4 py-3 text-center ${
                index % 2 === 1 ? 'border-l border-slate-200' : ''
              } ${index > 0 ? 'lg:border-l lg:border-slate-200' : 'lg:border-l-0'}`}
            >
              <GoldStars />
              <p className="text-2xl font-extrabold tracking-tight text-[#0B132B] sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16 grid items-center gap-10 lg:mt-20 lg:grid-cols-2 lg:gap-14">
        <img
          src="/home/researcher.jpg"
          alt="Laboratory researcher in a white coat"
          className="h-[22rem] w-full rounded-2xl object-cover object-top shadow-lg shadow-slate-900/10 sm:h-[28rem]"
        />
        <div>
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[#5B4CFF] px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-white uppercase">
            <Star className="h-3 w-3 fill-amber-300 text-amber-300" aria-hidden="true" />
            We take pride
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#0B132B] sm:text-4xl">
            Why Researchers Choose Research Peptides UK
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-500 sm:text-[15px]">
            Peptides are an area of growing interest within scientific and laboratory research communities. Current
            studies focus on their structural properties and potential roles in biological and biochemical research
            settings.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-[15px]">
            When purchasing British peptides online in the UK, it is important to select a reputable supplier that
            provides laboratory-grade products, verified purity, and clear documentation. All peptides are supplied
            strictly for research and laboratory use only and not for human or veterinary use.
          </p>
        </div>
      </div>

      <HomeFeatureTrust />
    </div>
  );
};
