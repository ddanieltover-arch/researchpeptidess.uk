/**
 * Research Peptides UK — 404 Not Found Page
 *
 * Clean, authoritative fallback page when an invalid compound reference or route is accessed.
 */

import React from 'react';
import { useStore } from '../context/StoreContext';
import { Search, ArrowLeft, Home, FileQuestion, BookOpen, ShieldAlert } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const { navigate, searchQuery, setSearchQuery } = useStore();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/shop');
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-stone-50">
      <div className="max-w-xl w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-800 border border-amber-300 shadow-inner">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono font-bold tracking-widest text-amber-800 uppercase bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
            HTTP 404 • Resource Not Located
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Document or Reagent Not Found
          </h1>
          <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
            The requested compound dossier, certificate of analysis, or laboratory policy page does not exist or has been relocated within our catalogue.
          </p>
        </div>

        {/* Search Compound Box */}
        <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto relative">
          <input
            type="text"
            placeholder="Search compound catalogue (e.g. BPC-157, Semax)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-24 py-2.5 text-xs bg-white border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-mono font-bold rounded-md transition-colors"
          >
            Search
          </button>
        </form>

        {/* Quick Action Navigation */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg transition-colors shadow-xs"
          >
            <Home className="w-3.5 h-3.5" />
            Store Overview
          </button>
          <button
            onClick={() => navigate('/shop')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            Browse Catalogue
          </button>
          <button
            onClick={() => navigate('/research-use')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg transition-colors shadow-xs"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-stone-500" />
            Compliance Statement
          </button>
        </div>
      </div>
    </div>
  );
};
