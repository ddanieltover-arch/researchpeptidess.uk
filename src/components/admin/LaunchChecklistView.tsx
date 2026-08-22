/**
 * Research Peptides UK — Admin Interactive Launch Readiness Checklist View
 *
 * Tracks production launch criteria across 7 core pillars:
 * 1. Infrastructure
 * 2. Commerce
 * 3. Operations
 * 4. Content
 * 5. Security
 * 6. SEO
 * 7. QA
 */

import React, { useState } from 'react';
import { INITIAL_LAUNCH_CHECKLIST } from '../../lib/launch-checklist';
import { LaunchChecklistItem, LaunchChecklistCategory } from '../../types';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  ShieldCheck,
  Search,
  CheckSquare,
  Sparkles,
} from 'lucide-react';

export const LaunchChecklistView: React.FC = () => {
  const [items, setItems] = useState<LaunchChecklistItem[]>(INITIAL_LAUNCH_CHECKLIST);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const categories: { key: string; label: string }[] = [
    { key: 'ALL', label: 'All Criteria' },
    { key: 'INFRASTRUCTURE', label: 'Infrastructure' },
    { key: 'COMMERCE', label: 'Commerce' },
    { key: 'OPERATIONS', label: 'Operations' },
    { key: 'CONTENT', label: 'Content' },
    { key: 'SECURITY', label: 'Security' },
    { key: 'SEO', label: 'SEO' },
    { key: 'QA', label: 'QA' },
  ];

  const handleToggleStatus = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus =
            item.status === 'PASSED'
              ? 'PENDING'
              : item.status === 'PENDING'
              ? 'MANUAL_VERIFICATION_REQUIRED'
              : 'PASSED';
          return {
            ...item,
            status: nextStatus,
            verifiedAt: nextStatus === 'PASSED' ? new Date().toISOString().split('T')[0] : undefined,
          };
        }
        return item;
      })
    );
  };

  const totalPassed = items.filter((i) => i.status === 'PASSED').length;
  const totalItems = items.length;
  const readinessPercentage = Math.round((totalPassed / totalItems) * 100);

  const filteredItems = items.filter((item) => {
    if (activeCategory !== 'ALL' && item.category !== activeCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-amber-600" />
            Production Launch Readiness Checklist
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Authoritative audit across infrastructure, commerce, scientific claims, security, and SEO.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-stone-100 p-2 rounded-xl border border-stone-200">
          <div className="text-right">
            <p className="text-[10px] font-mono uppercase text-stone-500 font-bold">Launch Readiness</p>
            <p className="text-base font-bold text-slate-900 font-mono">
              {totalPassed} / {totalItems} Passed ({readinessPercentage}%)
            </p>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-amber-500 flex items-center justify-center font-mono font-bold text-xs bg-white text-slate-900 shadow-sm">
            {readinessPercentage}%
          </div>
        </div>
      </div>

      {/* Categories Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-stone-200 pb-2">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item) => {
          const isPassed = item.status === 'PASSED';
          const isManual = item.status === 'MANUAL_VERIFICATION_REQUIRED';

          return (
            <div
              key={item.id}
              onClick={() => handleToggleStatus(item.id)}
              className={`p-5 rounded-xl border transition-all cursor-pointer shadow-sm hover:shadow-md space-y-3 ${
                isPassed
                  ? 'bg-white border-emerald-300 hover:border-emerald-400'
                  : isManual
                  ? 'bg-amber-50/50 border-amber-300 hover:border-amber-400'
                  : 'bg-stone-50 border-stone-300 hover:border-stone-400'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-stone-100 text-stone-700 uppercase border border-stone-200">
                      {item.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">{item.description}</p>
                </div>

                <div className="shrink-0">
                  {isPassed ? (
                    <div className="p-1 rounded-full bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : isManual ? (
                    <div className="p-1 rounded-full bg-amber-100 text-amber-700">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="p-1 rounded-full bg-stone-200 text-stone-500">
                      <Clock className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] font-mono text-stone-500">
                <span>Req: {item.requirement}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isPassed
                      ? 'text-emerald-800 bg-emerald-50'
                      : isManual
                      ? 'text-amber-800 bg-amber-100'
                      : 'text-stone-600 bg-stone-100'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
