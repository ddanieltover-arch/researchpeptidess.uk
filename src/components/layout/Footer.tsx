import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  FlaskConical,
  ShieldAlert,
  CheckCircle2,
  Mail,
  ArrowRight,
  Lock,
  Building2,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { BrandLogo } from '../ui/BrandLogo';

export const Footer: React.FC = () => {
  const { navigate, setSelectedCategorySlug, addToast } = useStore();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      addToast('success', 'Subscribed', 'Institutional research bulletin updates registered.');
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#0B132B] text-white border-t border-slate-800 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10 space-y-10">
        {/* COMPLIANCE DECLARATION */}
        <div className="bg-[#0F172A] border border-slate-800 p-5 rounded-xl text-slate-300 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 bg-slate-950 border border-sky-500/40 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-sky-400 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <h4 className="font-mono font-bold text-sky-400 uppercase tracking-wider text-xs">
                Strictly for Laboratory Research &amp; In-Vitro Analytical Use Only
              </h4>
              <p className="text-slate-400 leading-relaxed text-xs">
                All compounds supplied by <strong className="text-white">Research Peptides UK</strong> are strictly formulated for qualified laboratory research, chemical synthesis studies, and analytical instrument calibration. Not for human or veterinary administration.
              </p>
            </div>
          </div>
        </div>

        {/* 4-COLUMN FOOTER GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <div className="cursor-pointer" onClick={() => navigate('/')}>
              <BrandLogo variant="dark" size="sm" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              Analytical In-Vitro Biochemicals • Batch HPLC &amp; MS Documentation • UK Laboratory Supply.
            </p>
            <div className="flex items-center gap-2 text-xs text-sky-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              ISO 9001 Synthesized Reference Standards
            </div>
          </div>

          {/* Col 2: Support */}
          <div className="flex flex-col gap-2 font-mono">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">
              Support &amp; Requisitions
            </span>
            <button onClick={() => navigate('/shop')} className="text-left text-xs text-slate-400 hover:text-white transition-colors">
              Compound Catalogue
            </button>
            <button onClick={() => navigate('/cart')} className="text-left text-xs text-slate-400 hover:text-white transition-colors">
              Requisition Basket
            </button>
            <button onClick={() => navigate('/shipping')} className="text-left text-xs text-slate-400 hover:text-white transition-colors">
              Cold-Chain Shipping
            </button>
            <button onClick={() => navigate('/returns')} className="text-left text-xs text-slate-400 hover:text-white transition-colors">
              Returns &amp; Refunds
            </button>
            <button onClick={() => navigate('/faq')} className="text-left text-xs text-slate-400 hover:text-white transition-colors">
              Frequently Asked Questions
            </button>
            <button onClick={() => navigate('/contact')} className="text-left text-xs text-slate-400 hover:text-white transition-colors">
              Contact Laboratory
            </button>
          </div>

          {/* Col 3: Legal & Compliance */}
          <div className="flex flex-col gap-2 font-mono">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">
              Legal &amp; Verification
            </span>
            <button onClick={() => navigate('/about')} className="text-left text-xs text-slate-400 hover:text-white transition-colors">
              About Research Peptides UK
            </button>
            <button onClick={() => navigate('/quality')} className="text-left text-xs text-slate-400 hover:text-white transition-colors">
              Quality Standards &amp; HPLC
            </button>
            <button onClick={() => navigate('/research-use')} className="text-left text-xs text-slate-400 hover:text-white transition-colors">
              Research-Use Statement
            </button>
            <button onClick={() => navigate('/terms')} className="text-left text-xs text-slate-400 hover:text-white transition-colors">
              Terms of Service
            </button>
            <button onClick={() => navigate('/privacy')} className="text-left text-xs text-slate-400 hover:text-white transition-colors">
              Privacy Policy
            </button>
            <button onClick={() => navigate('/cookies')} className="text-left text-xs text-slate-400 hover:text-white transition-colors">
              Cookie Policy
            </button>
            <button onClick={() => navigate('/account')} className="text-left text-xs text-slate-400 hover:text-white transition-colors">
              Researcher Account
            </button>
          </div>

          {/* Col 4: Newsletter / Bulletin */}
          <div className="space-y-3 font-mono">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">
              Analytical Bulletin
            </span>
            <p className="text-xs text-slate-400">
              Receive batch updates, new reference standards, and COA publication notices.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <input
                type="email"
                required
                placeholder="lab.director@institution.ac.uk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#4353FF] focus:ring-1 focus:ring-[#4353FF] rounded-lg"
              />
              <Button type="submit" variant="primary" size="sm" className="w-full text-xs">
                Subscribe to Releases
              </Button>
            </form>
          </div>
        </div>

        {/* BOTTOM BAR WITH PAYMENT MARKS */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
          <p className="text-slate-500">
            © {new Date().getFullYear()} Research Peptides UK. All rights reserved. Registered UK Laboratory Supplier.
          </p>

          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-md text-[10px] font-bold text-slate-300">
              FASTER PAYMENTS
            </div>
            <div className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-md text-[10px] font-bold text-sky-400">
              BTC (-5%)
            </div>
            <div className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-md text-[10px] font-bold text-sky-400">
              USDT (-5%)
            </div>
            <div className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-md text-[10px] font-bold text-slate-300">
              GBP (£)
            </div>
            <div className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-md text-[10px] font-bold text-slate-300">
              EUR (€)
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
