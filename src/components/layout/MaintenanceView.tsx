/**
 * Research Peptides UK — Maintenance Mode View
 * Displayed when storeStatus is 'MAINTENANCE'.
 * Retains pristine brand identity, provides laboratory contact coordinates,
 * and prevents public commerce while backend migrations or audits run.
 */

import React from 'react';
import { useStore } from '../../context/StoreContext';
import { ShieldCheck, Mail, Phone, Lock, ArrowRight } from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';

export const MaintenanceView: React.FC = () => {
  const { storeSettings, navigate } = useStore();

  return (
    <div className="min-h-screen bg-[#0B132B] text-white flex flex-col justify-between p-6 sm:p-12 font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Brand Bar */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between border-b border-slate-800 pb-6">
        <BrandLogo variant="dark" size="md" />

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-mono font-semibold">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            Scheduled Maintenance
          </span>
        </div>
      </div>

      {/* Main Notice Body */}
      <div className="max-w-2xl mx-auto w-full text-center py-16 space-y-8">
        <div className="inline-flex p-4 rounded-2xl bg-slate-900 border border-slate-800 text-sky-400 shadow-2xl">
          <ShieldCheck className="w-12 h-12 stroke-[1.5]" />
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
            Laboratory Platform Update in Progress
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            Our central database, analytical Certificate of Analysis repository, and secure payment
            verification engine are undergoing scheduled technical upgrades. Storefront ordering
            is temporarily paused.
          </p>
        </div>

        {/* Contact Coordinates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-xs">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-mono text-slate-400 uppercase">Institutional Inquiries</div>
              <a
                href={`mailto:${storeSettings.primaryEmail}`}
                className="text-sm font-semibold text-white hover:text-sky-400 transition-colors"
              >
                {storeSettings.primaryEmail}
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-mono text-slate-400 uppercase">Direct Desk</div>
              <span className="text-sm font-semibold text-white">{storeSettings.phone}</span>
            </div>
          </div>
        </div>

        {/* Admin Bypass for Authorized Verification */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              navigate('/admin/login');
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#4353FF] hover:bg-[#3846E0] text-white text-xs font-mono font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <Lock className="w-3.5 h-3.5" />
            Authorized Admin Access
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Legal Footer */}
      <div className="max-w-5xl mx-auto w-full text-center border-t border-slate-800 pt-6 text-xs text-slate-500 font-mono space-y-1">
        <p>© 2026 Research Peptides UK. Strictly in-vitro laboratory analytical standards.</p>
        <p>Not for human or veterinary administration or clinical use.</p>
      </div>
    </div>
  );
};
