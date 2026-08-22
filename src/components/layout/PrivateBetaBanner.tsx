/**
 * Research Peptides UK — Private Beta Notice Banner
 * Displayed when storeStatus === 'PRIVATE_BETA'.
 * Clarifies that the platform is currently operating in controlled live validation mode.
 */

import React from 'react';
import { useStore } from '../../context/StoreContext';
import { Sparkles, ShieldCheck } from 'lucide-react';

export const PrivateBetaBanner: React.FC = () => {
  const { storeSettings } = useStore();

  if (storeSettings.storeStatus !== 'PRIVATE_BETA') {
    return null;
  }

  return (
    <aside aria-label="Private Beta Announcement" className="bg-[#0B132B] text-white px-4 py-1.5 text-xs font-medium border-b border-sky-500/30 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="inline-flex items-center gap-1 bg-[#4353FF] text-white font-bold px-2 py-0.5 rounded-full text-[10px] tracking-wide uppercase shadow-xs">
            <Sparkles className="w-3 h-3" />
            Private Beta
          </span>
          <span className="hidden sm:inline font-semibold text-slate-200">
            Controlled Live Validation Mode active on {storeSettings.primaryDomain}.
          </span>
          <span className="sm:hidden font-semibold text-slate-200">
            Controlled Beta Mode.
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[10px] text-sky-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            Manual Order &amp; Payment Settlement Active
          </span>
        </div>
      </div>
    </aside>
  );
};
