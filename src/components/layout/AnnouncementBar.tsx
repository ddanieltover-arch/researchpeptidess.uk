import React from 'react';
import { useStore } from '../../context/StoreContext';
import { ShieldAlert, Zap, Globe } from 'lucide-react';

export const AnnouncementBar: React.FC = () => {
  const { currency, setCurrency } = useStore();

  return (
    <div className="border-b border-[#3B46E0] bg-[#4353FF] py-1.5 px-4 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 sm:flex-row">
        <div className="flex items-center gap-3 overflow-x-auto py-0.5 no-scrollbar">
          <span className="flex items-center gap-1 tracking-wider text-sky-200">
            <ShieldAlert className="h-3.5 w-3.5 text-sky-300" />
            In-vitro laboratory supply
          </span>
          <span className="text-white/50">•</span>
          <span className="hidden sm:inline">Batch documentation where recorded</span>
          <span className="hidden text-white/50 sm:inline">•</span>
          <span className="hidden md:inline">UK &amp; EU shipping from configured methods</span>
          <span className="hidden text-white/50 lg:inline">•</span>
          <span className="hidden items-center gap-1 text-sky-200 lg:inline-flex">
            <Zap className="h-3 w-3 text-sky-300" />
            5% crypto settlement discount
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-1 rounded-md border border-white/20 bg-black/20 px-2 py-0.5">
            <Globe className="h-3 w-3 text-sky-200" />
            <button
              onClick={() => setCurrency('GBP')}
              className={`rounded-sm px-1 transition-colors ${
                currency === 'GBP' ? 'font-black text-white underline' : 'text-white/80 hover:text-white'
              }`}
            >
              GBP (£)
            </button>
            <span className="text-white/40">|</span>
            <button
              onClick={() => setCurrency('EUR')}
              className={`rounded-sm px-1 transition-colors ${
                currency === 'EUR' ? 'font-black text-white underline' : 'text-white/80 hover:text-white'
              }`}
            >
              EUR (€)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
