/**
 * Research Peptides UK — Privacy-First Cookie Consent Banner
 *
 * Enforces UK GDPR / ePrivacy Directive:
 * - Strictly essential cookies active by default
 * - Analytics & marketing cookies inactive until explicit opt-in
 * - Granular modal for customizing category preferences
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cookie, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { getSavedConsent, saveConsent, DEFAULT_CONSENT } from '../../lib/analytics';
import { CookieConsentPreferences } from '../../types';

export const CookieConsentBanner: React.FC = () => {
  const [hasDecided, setHasDecided] = useState<boolean>(true); // default true until client check
  const [showPreferencesModal, setShowPreferencesModal] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<CookieConsentPreferences>(DEFAULT_CONSENT);

  useEffect(() => {
    const saved = getSavedConsent();
    if (saved) {
      setPreferences(saved);
      setHasDecided(true);
    } else {
      setHasDecided(false);
    }
  }, []);

  const handleAcceptAll = () => {
    const fullConsent: CookieConsentPreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      decidedAt: new Date().toISOString(),
    };
    saveConsent(fullConsent);
    setPreferences(fullConsent);
    setHasDecided(true);
    setShowPreferencesModal(false);
  };

  const handleRejectNonEssential = () => {
    const minConsent: CookieConsentPreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      decidedAt: new Date().toISOString(),
    };
    saveConsent(minConsent);
    setPreferences(minConsent);
    setHasDecided(true);
    setShowPreferencesModal(false);
  };

  const handleSaveCustom = () => {
    saveConsent(preferences);
    setHasDecided(true);
    setShowPreferencesModal(false);
  };

  if (hasDecided && !showPreferencesModal) {
    return null;
  }

  return (
    <>
      {/* Banner */}
      {!hasDecided && !showPreferencesModal && (
        <aside
          aria-label="Cookie consent banner"
          className="fixed bottom-0 inset-x-0 z-50 p-4 bg-slate-900/95 text-stone-100 border-t border-amber-500/30 shadow-2xl backdrop-blur-md"
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5">
                <Cookie className="w-5 h-5" />
              </div>
              <div className="text-xs sm:text-sm text-stone-300">
                <p className="font-semibold text-white">Laboratory Cookie & Privacy Preferences</p>
                <p className="mt-0.5 text-stone-400">
                  We use strictly necessary technical cookies to maintain secure sessions, process orders, and record statutory compliance declarations. Optional analytical telemetry helps us improve platform performance only with your explicit consent.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={() => setShowPreferencesModal(true)}
                className="px-3 py-2 text-xs font-semibold text-stone-300 hover:text-white border border-stone-700 hover:border-stone-500 rounded-lg transition-colors whitespace-nowrap"
              >
                Customize
              </button>
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="px-3 py-2 text-xs font-semibold text-stone-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors whitespace-nowrap"
              >
                Reject Non-Essential
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg font-mono uppercase tracking-wider transition-colors whitespace-nowrap shadow-sm shadow-amber-400/20"
              >
                Accept All
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Granular Preferences Modal */}
      {showPreferencesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-stone-700 text-stone-100 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Manage Cookie Preferences</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPreferencesModal(false)}
                className="p-1 text-stone-400 hover:text-white rounded-md hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-stone-300 max-h-[60vh] overflow-y-auto pr-1">
              {/* Essential */}
              <div className="p-3.5 rounded-lg bg-slate-800/80 border border-stone-700/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-100 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-400" /> Strictly Necessary Cookies
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ALWAYS ACTIVE
                  </span>
                </div>
                <p className="text-stone-400 text-[11px]">
                  Essential for core platform operations, authentication security, CSRF protection, cart persistence, and research-use statutory compliance records.
                </p>
              </div>

              {/* Analytics */}
              <div className="p-3.5 rounded-lg bg-slate-800/80 border border-stone-700/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-100">Performance & Analytics Telemetry</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
                <p className="text-stone-400 text-[11px]">
                  Allows us to measure aggregated page views, load times, and diagnostic error reports to maintain optimal platform uptime without identifying individual researchers.
                </p>
              </div>

              {/* Marketing */}
              <div className="p-3.5 rounded-lg bg-slate-800/80 border border-stone-700/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-100">Marketing & Campaign Attribution</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
                <p className="text-stone-400 text-[11px]">
                  Used only to measure the effectiveness of our scientific communications and technical standard announcements. We never sell personal data.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-4 border-t border-stone-800">
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="px-3 py-2 text-xs font-semibold text-stone-400 hover:text-white"
              >
                Reject All
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-stone-600 rounded-lg transition-colors"
                >
                  Save Preferences
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg font-mono uppercase tracking-wider transition-colors"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
