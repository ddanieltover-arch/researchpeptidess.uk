/**
 * Research Peptides UK — Admin Store Settings & Business Configuration View
 *
 * Allows authorized administrators to manage:
 * - Legal Entity details (Company Number, VAT, Registered Office)
 * - Support and Data Protection email contacts
 * - Store environment mode (DEVELOPMENT, PREVIEW, PRODUCTION)
 * - Currency and domain parameters
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { StoreSettings, ApplicationEnvironment, StoreStatus } from '../../types';
import {
  Building2,
  Mail,
  ShieldCheck,
  Globe,
  Save,
  CheckCircle2,
  AlertTriangle,
  Server,
  Lock,
} from 'lucide-react';

export const StoreSettingsView: React.FC = () => {
  const { storeSettings, updateStoreSettings, addToast } = useStore();
  const [form, setForm] = useState<StoreSettings>({ ...storeSettings });
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings(form);
    setIsSaved(true);
    addToast('success', 'Store Settings Saved', 'Business configuration and legal parameters updated.');
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleInputChange = (field: keyof StoreSettings, value: unknown) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-600" />
            Store Settings & Legal Entity Configuration
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Configure authoritative company registration, tax numbers, contact details, and production mode.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-mono font-bold uppercase transition-colors shadow-sm"
        >
          {isSaved ? <CheckCircle2 className="w-4 h-4 text-emerald-950" /> : <Save className="w-4 h-4" />}
          {isSaved ? 'Settings Saved' : 'Save Changes'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Environment & Mode Card */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-stone-100 pb-3">
            <Server className="w-4 h-4 text-amber-600" />
            Application Environment & Security Mode
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Store Availability Status (Launch Switch)
              </label>
              <select
                value={form.storeStatus || (form.maintenanceMode ? 'MAINTENANCE' : 'LIVE')}
                onChange={(e) => {
                  const status = e.target.value as StoreStatus;
                  handleInputChange('storeStatus', status);
                  handleInputChange('maintenanceMode', status === 'MAINTENANCE');
                }}
                className={`w-full text-xs font-mono p-2.5 rounded-lg border font-bold ${
                  form.storeStatus === 'LIVE'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                    : form.storeStatus === 'PRIVATE_BETA'
                    ? 'border-amber-500 bg-amber-50 text-amber-900'
                    : 'border-rose-500 bg-rose-50 text-rose-900'
                } focus:outline-none`}
              >
                <option value="MAINTENANCE">MAINTENANCE (Temporarily Unavailable)</option>
                <option value="PRIVATE_BETA">PRIVATE_BETA (Authorized Real-World Testing)</option>
                <option value="LIVE">LIVE (Public Open Storefront)</option>
              </select>
              <p className="text-[11px] text-stone-400 mt-1">
                Controls customer storefront access and checkout availability.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Active Runtime Environment
              </label>
              <select
                value={form.environment}
                onChange={(e) => handleInputChange('environment', e.target.value as ApplicationEnvironment)}
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-stone-300 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none"
              >
                <option value="DEVELOPMENT">DEVELOPMENT (Simulated Verification)</option>
                <option value="PREVIEW">PREVIEW (Staging & QA)</option>
                <option value="PRODUCTION">PRODUCTION (Strict Audit & Live Ledgers)</option>
              </select>
              <p className="text-[11px] text-stone-400 mt-1">
                Production mode enforces live validation and immutable audit trails.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Primary Store Domain
              </label>
              <div className="flex items-center gap-1.5 p-2.5 rounded-lg border border-stone-300 bg-stone-50 text-xs font-mono text-stone-800">
                <Globe className="w-4 h-4 text-stone-400 shrink-0" />
                <input
                  type="text"
                  value={form.primaryDomain}
                  onChange={(e) => handleInputChange('primaryDomain', e.target.value)}
                  className="w-full bg-transparent focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                Enforces canonical SEO URL and sitemap mapping.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Primary Storefront Currency
              </label>
              <select
                value={form.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-stone-300 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none"
              >
                <option value="GBP">GBP (£ - British Pound Sterling)</option>
                <option value="EUR">EUR (€ - Euro)</option>
              </select>
              <p className="text-[11px] text-stone-400 mt-1">
                Base ledger currency for UK and European shipments.
              </p>
            </div>
          </div>
        </div>

        {/* Legal Entity Details */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-stone-100 pb-3">
            <Building2 className="w-4 h-4 text-amber-600" />
            Legal Entity & Registration Details
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Legal Entity Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.legalEntityName}
                onChange={(e) => handleInputChange('legalEntityName', e.target.value)}
                placeholder="e.g. Research Peptides UK Ltd"
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:border-amber-500 focus:outline-none"
              />
              <p className="text-[11px] text-stone-400 mt-1">
                Injected into Terms of Service, In-Vitro disclaimers, and commercial invoices.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Company Registration Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.companyNumber}
                onChange={(e) => handleInputChange('companyNumber', e.target.value)}
                placeholder="e.g. 14982134"
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-stone-300 focus:border-amber-500 focus:outline-none"
              />
              <p className="text-[11px] text-stone-400 mt-1">
                Companies House registration number (England and Wales).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                VAT Registration Number
              </label>
              <input
                type="text"
                value={form.vatNumber}
                onChange={(e) => handleInputChange('vatNumber', e.target.value)}
                placeholder="e.g. GB 429 8219 02"
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-stone-300 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Governing Law Jurisdiction
              </label>
              <input
                type="text"
                value={form.governingLaw}
                onChange={(e) => handleInputChange('governingLaw', e.target.value)}
                placeholder="England and Wales"
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Registered Office Address <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={form.registeredOfficeAddress}
                onChange={(e) => handleInputChange('registeredOfficeAddress', e.target.value)}
                placeholder="e.g. 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom"
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Contact Coordinates */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-stone-100 pb-3">
            <Mail className="w-4 h-4 text-amber-600" />
            Communication & Data Protection Contacts
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Primary Laboratory Inquiries Email
              </label>
              <input
                type="email"
                value={form.primaryEmail}
                onChange={(e) => handleInputChange('primaryEmail', e.target.value)}
                placeholder="info@researchpeptidess.uk"
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Order & Payment Support Email
              </label>
              <input
                type="email"
                value={form.supportEmail}
                onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                placeholder="info@researchpeptidess.uk"
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Data Protection Officer (GDPR) Email
              </label>
              <input
                type="email"
                value={form.privacyEmail}
                onChange={(e) => handleInputChange('privacyEmail', e.target.value)}
                placeholder="info@researchpeptidess.uk"
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Direct Laboratory Telephone
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+44 (0) 20 8123 4567"
                className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
