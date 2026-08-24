/**
 * Research Peptides UK — Unified Reusable CMS & Policy Page Component
 *
 * Renders all 11 required informational and legal routes:
 * /about, /research, /quality, /faq, /contact, /shipping, /returns, /terms, /privacy, /cookies, /research-use
 *
 * Features:
 * - Dynamic SEO meta tags and canonical URLs
 * - Substitution of real business settings (or highlighting required business inputs)
 * - Research-use statutory reminder
 * - Print / Share actions
 */

import React from 'react';
import { CMSPage } from '../../types';
import { useStore } from '../../context/StoreContext';
import { MetaTags } from '../seo/MetaTags';
import { getSeoMetadataForPath } from '../../lib/seo';
import { AppLink } from '../ui/AppLink';
import { ROUTES } from '../../lib/routing';
import { ContactEnquiryForm } from './ContactEnquiryForm';
import { resolvePublicBusinessValue } from '../../lib/public-placeholders';
import {
  ShieldAlert,
  Printer,
  ChevronRight,
  Building,
  Calendar,
  FileCheck,
} from 'lucide-react';

interface CMSPageViewProps {
  page: CMSPage;
}

export const CMSPageView: React.FC<CMSPageViewProps> = ({ page }) => {
  const { storeSettings } = useStore();

  const seo = getSeoMetadataForPath(`/${page.slug}`, { cmsPage: page });

  // Replace configured business placeholders with actual store settings
  const renderResolvedContent = () => {
    let text = page.contentMarkdown;

    const replacements: Record<string, string> = {
      '[LEGAL_ENTITY_NAME]': resolvePublicBusinessValue(storeSettings.legalEntityName),
      '[REGISTERED_OFFICE_ADDRESS]': resolvePublicBusinessValue(storeSettings.registeredOfficeAddress),
      '[COMPANY_NUMBER]': resolvePublicBusinessValue(storeSettings.companyNumber),
      '[VAT_NUMBER]': resolvePublicBusinessValue(storeSettings.vatNumber),
      '[PRIMARY_CONTACT_EMAIL]': storeSettings.primaryEmail,
      '[SUPPORT_CONTACT_EMAIL]': storeSettings.supportEmail,
      '[DATA_PROTECTION_EMAIL]': storeSettings.privacyEmail,
      '[PRIMARY_CONTACT_PHONE]': resolvePublicBusinessValue(storeSettings.phone),
      '[GOVERNING_LAW_COUNTRY]': resolvePublicBusinessValue(storeSettings.governingLaw),
    };

    for (const [placeholder, val] of Object.entries(replacements)) {
      text = text.split(placeholder).join(val);
    }

    return text;
  };

  const resolvedMarkdown = renderResolvedContent();

  // Simple Markdown parsing for headers, tables, blockquotes, horizontal rules, lists, and bold text
  const renderMarkdownElements = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inTable = false;
    let tableRows: string[][] = [];

    const flushTable = () => {
      if (tableRows.length > 0) {
        const header = tableRows[0];
        const body = tableRows.slice(2); // Skip separator row
        elements.push(
          <div key={`table-${elements.length}`} className="my-6 overflow-x-auto border border-stone-200 rounded-lg shadow-sm">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-stone-100 text-stone-900 font-semibold border-b border-stone-200">
                <tr>
                  {header.map((col, idx) => (
                    <th key={idx} className="p-3">
                      {col.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {body.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-3 text-stone-700">
                        {cell.trim().replace(/\*\*(.*?)\*\*/g, '$1')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        inTable = false;
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Check Table
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        const cells = trimmed
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());
        tableRows.push(cells);
        return;
      } else if (inTable) {
        flushTable();
      }

      // Headings
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={idx} className="text-lg sm:text-xl font-bold text-slate-900 mt-8 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-amber-500 rounded-full inline-block"></span>
            {trimmed.replace('### ', '')}
          </h3>
        );
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={idx} className="text-xl sm:text-2xl font-bold text-slate-900 mt-10 mb-4 border-b border-stone-200 pb-2">
            {trimmed.replace('## ', '')}
          </h2>
        );
      } else if (trimmed.startsWith('# ')) {
        elements.push(
          <h1 key={idx} className="text-2xl sm:text-3xl font-extrabold text-slate-950 mt-6 mb-4 tracking-tight">
            {trimmed.replace('# ', '')}
          </h1>
        );
      } else if (trimmed.startsWith('---')) {
        elements.push(<hr key={idx} className="my-6 border-stone-200" />);
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        // Bullet list
        const rawText = trimmed.substring(2);
        elements.push(
          <li key={idx} className="ml-5 list-disc text-stone-700 text-sm leading-relaxed my-1">
            {renderFormattedText(rawText)}
          </li>
        );
      } else if (/^\d+\.\s/.test(trimmed)) {
        // Numbered list
        const rawText = trimmed.replace(/^\d+\.\s/, '');
        elements.push(
          <li key={idx} className="ml-5 list-decimal text-stone-700 text-sm leading-relaxed my-1">
            {renderFormattedText(rawText)}
          </li>
        );
      } else if (trimmed.length > 0) {
        // Regular paragraph
        elements.push(
          <p key={idx} className="text-stone-700 text-sm sm:text-base leading-relaxed my-3">
            {renderFormattedText(trimmed)}
          </p>
        );
      }
    });

    if (inTable) {
      flushTable();
    }

    return elements;
  };

  const renderFormattedText = (text: string) => {
    // Check for unconfigured placeholders
    const parts = text.split(/(\[.*?\])/g);
    return parts.map((part, pIdx) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        return (
          <span
            key={pIdx}
            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300"
            title="Business input placeholder to be configured in Store Settings"
          >
            {part}
          </span>
        );
      }

      // Check bold
      const boldParts = part.split(/(\*\*.*?\*\*)/g);
      return boldParts.map((bPart, bIdx) => {
        if (bPart.startsWith('**') && bPart.endsWith('**')) {
          return (
            <strong key={`${pIdx}-${bIdx}`} className="font-semibold text-slate-900">
              {bPart.slice(2, -2)}
            </strong>
          );
        }
        return bPart;
      });
    });
  };

  return (
    <div className="bg-stone-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      {/* Inject SEO tags for this page */}
      <MetaTags seo={seo} />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-stone-500 font-mono">
          <AppLink href={ROUTES.home} className="hover:text-stone-900 transition-colors">
            HOME
          </AppLink>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-amber-700 font-semibold uppercase">{page.category}</span>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-stone-900 truncate max-w-xs">{page.title}</span>
        </nav>

        {/* Page Header Card */}
        <header className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase bg-stone-100 text-stone-800 border border-stone-200">
                <FileCheck className="w-3.5 h-3.5 text-amber-600" />
                {page.category} POLICY
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                {page.title}
              </h1>
              {page.subtitle && (
                <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
                  {page.subtitle}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200"
                title="Print this official policy document"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / PDF
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-stone-500 pt-4 font-mono">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              Effective Date: {page.lastUpdated}
            </span>
            <span className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-stone-400" />
              Jurisdiction: England & Wales
            </span>
          </div>
        </header>

        {/* In-Vitro Statutory Research Banner */}
        <section
          aria-label="Statutory Research Notice"
          className="bg-amber-500/10 border-l-4 border-amber-600 p-4 rounded-r-xl flex items-start gap-3 text-xs sm:text-sm text-amber-950"
        >
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-900">STATUTORY IN-VITRO RESEARCH MANDATE: </span>
            All chemicals, reagents, and compounds provided by Research Peptides UK are exclusively intended for laboratory experimentation and analytical standards. Strictly not for human or veterinary administration.
          </div>
        </section>

        {/* Main Markdown Body Content */}
        <article className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-10 shadow-sm prose prose-stone max-w-none">
          {renderMarkdownElements(resolvedMarkdown)}
        </article>

        {page.slug === 'contact' && <ContactEnquiryForm />}

        {/* Footer Support Prompt */}
        <footer className="bg-stone-900 text-stone-200 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-bold text-white text-sm">Need catalogue or order help?</h4>
            <p className="text-xs text-stone-400">Use the contact page or email the published support address. We do not claim specialist scientific advisory services.</p>
          </div>
          <AppLink
            href="/contact"
            className="px-4 py-2 text-xs font-mono font-bold uppercase bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg transition-colors shrink-0"
          >
            Contact Support Desk
          </AppLink>
        </footer>
      </div>
    </div>
  );
};
