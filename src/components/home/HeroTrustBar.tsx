import React from 'react';
import { Clock, FileText, MapPin, Package, ShieldCheck, type LucideIcon } from 'lucide-react';

const STATS = [
  { value: '50+', label: 'Compounds' },
  { value: '99%+', label: 'HPLC Purity' },
  { value: '24hr', label: 'Dispatch' },
  { value: '7yrs', label: 'UK Trusted' },
] as const;

const FEATURES: Array<{ icon: LucideIcon; title: string; subtitle: string }> = [
  { icon: ShieldCheck, title: '99% HPLC Purity', subtitle: 'Independently verified' },
  { icon: Package, title: 'UK Royal Mail', subtitle: 'Tracked & discreet' },
  { icon: Clock, title: 'Same-Day Dispatch', subtitle: 'Order before 2PM' },
  { icon: MapPin, title: 'UK Manufactured', subtitle: 'British peptides lab' },
  { icon: FileText, title: 'COA Available', subtitle: 'For every batch' },
];

export const HeroTrustBar: React.FC = () => {
  return (
    <div className="mt-14 sm:mt-16">
      <div className="grid grid-cols-2 sm:grid-cols-4">
        {STATS.map((stat, index) => (
          <div
            key={stat.label}
            className={`px-4 py-2 text-center ${
              index % 2 === 1 ? 'border-l border-slate-200/80' : ''
            } ${index > 0 ? 'sm:border-l sm:border-slate-200/80' : 'sm:border-l-0'}`}
          >
            <p className="text-3xl font-extrabold tracking-tight text-[#3B5BFF] sm:text-4xl">{stat.value}</p>
            <p className="mt-1 text-[11px] font-semibold tracking-[0.18em] text-slate-400 uppercase">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="-mx-4 mt-8 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex min-w-[52rem] items-stretch divide-x divide-slate-200 rounded-full border border-slate-200 bg-white py-3 shadow-lg shadow-slate-900/10 lg:min-w-0">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="flex min-w-0 flex-1 items-center gap-3 px-4 lg:px-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B132B] text-white">
                <feature.icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#0B132B]">{feature.title}</p>
                <p className="text-xs text-slate-400">{feature.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
