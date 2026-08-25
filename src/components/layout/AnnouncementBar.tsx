import React from 'react';
import { ShieldAlert, Zap, Globe } from 'lucide-react';

const ANNOUNCEMENTS = [
  { icon: ShieldAlert, text: 'In-vitro laboratory supply', accent: true },
  { icon: null, text: 'Batch documentation where recorded', accent: false },
  { icon: null, text: 'UK & EU shipping from configured methods', accent: false },
  { icon: Zap, text: '5% crypto settlement discount after verification', accent: true },
] as const;

function TickerCopy({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-8 px-8">
      {ANNOUNCEMENTS.map((item) => {
        const Icon = item.icon;
        return (
          <span key={`${duplicate ? 'b' : 'a'}-${item.text}`} className="flex items-center gap-8">
            <span className={`flex items-center gap-1.5 whitespace-nowrap ${item.accent ? 'text-sky-200' : 'text-white'}`}>
              {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 text-sky-300" /> : null}
              {item.text}
            </span>
            <span className="text-white/45" aria-hidden="true">
              •
            </span>
          </span>
        );
      })}
    </div>
  );
}

export const AnnouncementBar: React.FC = () => {
  return (
    <div className="border-b border-[#3B46E0] bg-gradient-to-r from-[#4353FF] to-[#5B4DFF] font-display text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
      <p className="sr-only">
        In-vitro laboratory supply. Batch documentation where recorded. UK and EU shipping from configured methods. 5%
        crypto settlement discount after verification.
      </p>

      <div className="flex items-center">
        <div className="relative min-w-0 flex-1 overflow-hidden py-1.5 motion-reduce:overflow-x-auto">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#4353FF] to-transparent motion-reduce:hidden" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#5B4DFF] to-transparent motion-reduce:hidden" />
          <div
            aria-hidden="true"
            className="flex w-max animate-announcement-marquee hover:[animation-play-state:paused] focus-within:[animation-play-state:paused] motion-reduce:animate-none"
          >
            <TickerCopy />
            <div className="motion-reduce:hidden">
              <TickerCopy duplicate />
            </div>
          </div>
        </div>

        <div className="relative z-20 shrink-0 border-l border-white/15 bg-[#5B4DFF] py-1.5 pr-4 pl-3 sm:pr-6">
          <div className="flex items-center gap-1 rounded-md border border-white/20 bg-black/20 px-2 py-0.5">
            <Globe className="h-3 w-3 text-sky-200" />
            <span className="rounded-sm px-1 font-black text-white">Prices in GBP (£)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
