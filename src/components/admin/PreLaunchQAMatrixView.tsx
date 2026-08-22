/**
 * Research Peptides UK — Admin Pre-Launch QA Test Matrix View
 *
 * Runs and displays automated verification results across:
 * - Customer & Catalogue Experience
 * - Payment Calculations & Crypto Discounts
 * - Security & IDOR Authorization
 * - Scientific Claim Governance & Restricted Keyword Scans
 */

import React, { useState } from 'react';
import { runPreLaunchQAMatrix } from '../../lib/qa-matrix';
import { QASuiteResult } from '../../types';
import {
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  RotateCw,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const PreLaunchQAMatrixView: React.FC = () => {
  const [suites, setSuites] = useState<QASuiteResult[]>(runPreLaunchQAMatrix());
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [expandedSuite, setExpandedSuite] = useState<string | null>(null);

  const handleRunAll = () => {
    setIsRunning(true);
    setTimeout(() => {
      const results = runPreLaunchQAMatrix();
      setSuites(results);
      setIsRunning(false);
    }, 400);
  };

  const totalAssertions = suites.reduce((acc, s) => acc + s.totalAssertions, 0);
  const totalPassed = suites.reduce((acc, s) => acc + s.passedAssertions, 0);
  const totalFailed = suites.reduce((acc, s) => acc + s.failedAssertions, 0);
  const totalDuration = suites.reduce((acc, s) => acc + s.durationMs, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            Pre-Launch QA Test Matrix & Integrity Assertions
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Automated regression and compliance assertions testing commerce rules, state machines, and security locks.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunAll}
          disabled={isRunning}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-mono font-bold uppercase transition-colors shadow-sm disabled:opacity-50"
        >
          {isRunning ? <RotateCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {isRunning ? 'Running QA Matrix...' : 'Run All QA Assertions'}
        </button>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-sm">
          <p className="text-[10px] font-mono uppercase text-stone-500 font-bold">Total Assertions</p>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1">{totalAssertions}</p>
        </div>

        <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-sm">
          <p className="text-[10px] font-mono uppercase text-stone-500 font-bold">Passed</p>
          <p className="text-xl font-bold text-emerald-600 font-mono mt-1">{totalPassed}</p>
        </div>

        <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-sm">
          <p className="text-[10px] font-mono uppercase text-stone-500 font-bold">Failed</p>
          <p className="text-xl font-bold text-rose-600 font-mono mt-1">{totalFailed}</p>
        </div>

        <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-sm">
          <p className="text-[10px] font-mono uppercase text-stone-500 font-bold">Execution Time</p>
          <p className="text-xl font-bold text-stone-700 font-mono mt-1">{totalDuration.toFixed(1)} ms</p>
        </div>
      </div>

      {/* Test Suites Accordion */}
      <div className="space-y-4">
        {suites.map((suite) => {
          const isExpanded = expandedSuite === suite.suiteId || expandedSuite === null;
          const isAllPassed = suite.failedAssertions === 0;

          return (
            <div
              key={suite.suiteId}
              className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden"
            >
              <div
                onClick={() => setExpandedSuite(isExpanded && expandedSuite === suite.suiteId ? '' : suite.suiteId)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-stone-50 transition-colors border-b border-stone-100"
              >
                <div className="flex items-center gap-3">
                  {isAllPassed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{suite.suiteName}</h3>
                    <p className="text-[11px] text-stone-500 font-mono">
                      {suite.passedAssertions}/{suite.totalAssertions} passed ({suite.durationMs.toFixed(1)}ms)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold ${
                      isAllPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {isAllPassed ? 'PASSED' : 'FAILED'}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 bg-stone-50/50 divide-y divide-stone-200/60">
                  {suite.assertions.map((assertion) => (
                    <div key={assertion.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              assertion.passed ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          ></span>
                          <span className="text-xs font-bold text-slate-900">{assertion.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-stone-400">
                          {assertion.durationMs.toFixed(2)}ms
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 pl-4">{assertion.description}</p>
                      {assertion.details && (
                        <pre className="bg-stone-900 text-stone-300 p-2 rounded text-[10px] font-mono mt-1 ml-4 overflow-x-auto">
                          {JSON.stringify(assertion.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
