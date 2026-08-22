/**
 * Research Peptides UK — Admin Observability & Error Monitoring View
 *
 * Displays live diagnostic, security, and exception logs with:
 * - Request Correlation IDs (req_corr_xxx)
 * - Sanitized payloads
 * - Filter by Log Level (INFO, WARN, ERROR, FATAL)
 * - Search by route, operation, or user role
 */

import React, { useState } from 'react';
import { getObservabilityLogs, clearObservabilityLogs } from '../../lib/observability';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Info,
  Search,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { LogLevel } from '../../types';

export const ObservabilityView: React.FC = () => {
  const [logs, setLogs] = useState(getObservabilityLogs());
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleRefresh = () => {
    setLogs(getObservabilityLogs());
  };

  const handleClear = () => {
    if (confirm('Clear all in-memory observability logs?')) {
      clearObservabilityLogs();
      setLogs([]);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLogs = logs.filter((log) => {
    if (levelFilter !== 'ALL' && log.level !== levelFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.correlationId.toLowerCase().includes(q) ||
        log.route.toLowerCase().includes(q) ||
        log.operation.toLowerCase().includes(q) ||
        log.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-600" />
            Observability & Request Correlation Monitor
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Real-time trace logs across checkout, order creation, payment verification, and inventory locks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Logs
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-stone-600 shrink-0">Level:</span>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="text-xs font-mono p-2 rounded-lg border border-stone-300 bg-stone-50 focus:outline-none"
          >
            <option value="ALL">ALL LEVELS</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
            <option value="FATAL">FATAL</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-72 bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs">
          <Search className="w-4 h-4 text-stone-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search correlation ID, route..."
            className="w-full bg-transparent focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-stone-400 text-xs">
            No observability log entries match current filters.
          </div>
        ) : (
          <div className="divide-y divide-stone-100 max-h-[600px] overflow-y-auto font-mono text-xs">
            {filteredLogs.map((log) => {
              const isError = log.level === 'ERROR' || log.level === 'FATAL';
              const isWarn = log.level === 'WARN';

              return (
                <div key={log.id} className="p-4 hover:bg-stone-50 transition-colors space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isError
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : isWarn
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-800 border border-slate-300'
                        }`}
                      >
                        {log.level}
                      </span>
                      <span className="font-bold text-slate-900">{log.operation}</span>
                      <span className="text-stone-500">{log.route}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-stone-400">
                      <span>{log.timestamp.replace('T', ' ').substring(0, 19)}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(log.id, log.correlationId)}
                        className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-200 transition-colors text-[10px]"
                        title="Copy Request Correlation ID"
                      >
                        {copiedId === log.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        {log.correlationId}
                      </button>
                    </div>
                  </div>

                  <p className="text-stone-700 text-xs leading-relaxed">{log.message}</p>

                  {log.details && Object.keys(log.details).length > 0 && (
                    <pre className="bg-stone-900 text-stone-200 p-2.5 rounded-lg text-[11px] overflow-x-auto leading-tight">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
