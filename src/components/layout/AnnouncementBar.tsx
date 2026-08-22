import React from 'react';
import { useStore } from '../../context/StoreContext';
import { ShieldAlert, Zap, Globe, UserCheck, Sparkles } from 'lucide-react';
import { UserRole } from '../../types';

export const AnnouncementBar: React.FC = () => {
  const { currency, setCurrency, currentUser, setUserRole } = useStore();

  return (
    <div className="bg-[#4353FF] text-white text-[10px] py-1.5 px-4 font-bold tracking-wider uppercase border-b border-[#3B46E0] font-mono">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        {/* Left: Research Guarantee & Compliance */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-0.5">
          <span className="flex items-center gap-1 text-sky-200 tracking-wider">
            <ShieldAlert className="h-3.5 w-3.5 text-sky-300" />
            99% Pure British Peptides
          </span>
          <span className="text-white/50">•</span>
          <span className="hidden sm:inline">HPLC Verified</span>
          <span className="text-white/50 hidden sm:inline">•</span>
          <span className="hidden md:inline">UK Tracked 24 Delivery</span>
          <span className="text-white/50 hidden lg:inline">•</span>
          <span className="hidden lg:inline text-sky-200 flex items-center gap-1">
            <Zap className="h-3 w-3 text-sky-300" />
            5% Automatic Crypto Discount
          </span>
        </div>

        {/* Right: Currency & Role Architecture Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Currency Selector */}
          <div className="flex items-center gap-1 bg-black/20 border border-white/20 rounded-md px-2 py-0.5">
            <Globe className="h-3 w-3 text-sky-200" />
            <button
              onClick={() => setCurrency('GBP')}
              className={`px-1 rounded-sm transition-colors ${
                currency === 'GBP' ? 'text-white font-black underline' : 'text-white/80 hover:text-white'
              }`}
            >
              GBP (£)
            </button>
            <span className="text-white/40">|</span>
            <button
              onClick={() => setCurrency('EUR')}
              className={`px-1 rounded-sm transition-colors ${
                currency === 'EUR' ? 'text-white font-black underline' : 'text-white/80 hover:text-white'
              }`}
            >
              EUR (€)
            </button>
          </div>

          {/* Quick Demo Role Switcher */}
          <div className="hidden sm:flex items-center gap-1.5 bg-black/20 border border-white/20 rounded-md px-2 py-0.5">
            <UserCheck className="h-3 w-3 text-sky-200" />
            <span className="text-white/80 text-[9px]">Role:</span>
            <select
              value={currentUser.role}
              onChange={(e) => setUserRole(e.target.value as UserRole)}
              className="bg-transparent text-white text-[9px] font-bold focus:outline-none cursor-pointer tracking-normal"
            >
              <option value="CUSTOMER" className="bg-[#0F172A] text-white">Customer (Academic)</option>
              <option value="ADMIN" className="bg-[#0F172A] text-white">Admin (Lab Director)</option>
              <option value="ANALYST" className="bg-[#0F172A] text-white">QC Analyst</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
