/**
 * Research Peptides UK — Admin CMS & Claim Governance Manager
 *
 * Allows administrators to:
 * - Edit non-product informational & policy pages (/about, /quality, /terms, /privacy, etc.)
 * - Run live real-time Content Safety & Claim Governance scans
 * - Prevent accidental publishing of prohibited therapeutic or personal use copy
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { CMSPage } from '../../types';
import { auditContentGovernance, ContentGovernanceAuditReport } from '../../lib/claim-governance';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Save,
  Globe,
  Lock,
  ExternalLink,
  Info,
} from 'lucide-react';

export const CmsManagerView: React.FC = () => {
  const { cmsPages, updateCmsPage, addToast, navigate } = useStore();
  const [selectedSlug, setSelectedSlug] = useState<string>(cmsPages[0]?.slug || 'about');

  const currentPage = cmsPages.find((p) => p.slug === selectedSlug) || cmsPages[0];

  const [form, setForm] = useState<CMSPage>({ ...currentPage });

  // Handle switching pages
  const handleSelectPage = (slug: string) => {
    const page = cmsPages.find((p) => p.slug === slug);
    if (page) {
      setSelectedSlug(slug);
      setForm({ ...page });
    }
  };

  // Live Claim Governance Audit
  const auditReport: ContentGovernanceAuditReport = auditContentGovernance(form.contentMarkdown);

  const handleSave = () => {
    if (!auditReport.isCompliant) {
      addToast(
        'error',
        'Compliance Violation',
        'Cannot publish content containing prohibited therapeutic or administration claims.'
      );
      return;
    }

    updateCmsPage(form.slug, form);
    addToast('success', 'Page Saved', `Updated content for /${form.slug}.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600" />
            Content Management & Scientific Claim Governance
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Manage storefront informational pages and verify compliance against in-vitro research standards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/${form.slug}`)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview Public Page
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!auditReport.isCompliant}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-colors shadow-sm ${
              auditReport.isCompliant
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-stone-300 text-stone-500 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar + Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Navigation: Page Selector */}
        <div className="lg:col-span-1 space-y-2">
          <h3 className="text-xs font-mono font-bold text-stone-500 uppercase px-2">Storefront Pages</h3>
          <div className="bg-white border border-stone-200 rounded-xl p-2 divide-y divide-stone-100">
            {cmsPages.map((page) => {
              const isSelected = page.slug === selectedSlug;
              return (
                <button
                  key={page.id}
                  onClick={() => handleSelectPage(page.slug)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-50 text-amber-950 font-bold border border-amber-300'
                      : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="truncate">
                    <p className="truncate">{page.title}</p>
                    <span className="text-[10px] text-stone-400 font-mono">/{page.slug}</span>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold ${
                      page.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {page.isPublished ? 'PUB' : 'DRAFT'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Area: Form & Live Claim Audit */}
        <div className="lg:col-span-3 space-y-6">
          {/* Claim Governance Audit Bar */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              auditReport.isCompliant
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex items-start gap-3">
              {auditReport.isCompliant ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs">
                    {auditReport.isCompliant ? 'Content Safety Passed' : 'Scientific Claim Violations Detected'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/80 border border-current">
                    Score: {auditReport.score}/100
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {auditReport.isCompliant
                    ? 'Text conforms strictly to in-vitro analytical research positioning with no prohibited medical directives.'
                    : 'Text contains keywords or statements that violate British chemical research supply compliance.'}
                </p>
              </div>
            </div>

            {auditReport.containsUnsubstitutedPlaceholders && (
              <div className="px-2.5 py-1 rounded bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-mono shrink-0">
                {auditReport.unsubstitutedPlaceholders.length} Pending Placeholders
              </div>
            )}
          </div>

          {/* List Violations if any */}
          {auditReport.violations.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-rose-900 uppercase font-mono">Violations to resolve:</h4>
              <ul className="space-y-1.5 text-xs text-rose-800">
                {auditReport.violations.map((v, i) => (
                  <li key={i} className="flex items-start gap-2 bg-white/60 p-2 rounded border border-rose-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Prohibited term: "{v.term}"</span> — {v.explanation}
                      <p className="text-[11px] text-stone-600 mt-0.5">Recommendation: {v.recommendation}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Page Details Form */}
          <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Page Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Subtitle / Tagline</label>
                <input
                  type="text"
                  value={form.subtitle || ''}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">SEO Meta Title</label>
                <input
                  type="text"
                  value={form.seoTitle}
                  onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Publication Status</label>
                <select
                  value={form.isPublished ? 'PUBLISHED' : 'DRAFT'}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.value === 'PUBLISHED' })}
                  className="w-full text-xs p-2.5 rounded-lg border border-stone-300 bg-stone-50 focus:border-amber-500 focus:outline-none"
                >
                  <option value="PUBLISHED">Published (Indexable)</option>
                  <option value="DRAFT">Draft (Internal Only)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">SEO Description</label>
                <textarea
                  rows={2}
                  value={form.seoDescription}
                  onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Markdown Content Editor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-stone-700">Content Markdown</label>
                <span className="text-[11px] text-stone-400 font-mono">Supports # Headings, tables, and bold formatting</span>
              </div>
              <textarea
                rows={16}
                value={form.contentMarkdown}
                onChange={(e) => setForm({ ...form, contentMarkdown: e.target.value })}
                className="w-full font-mono text-xs p-3.5 rounded-lg border border-stone-300 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none leading-relaxed"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
