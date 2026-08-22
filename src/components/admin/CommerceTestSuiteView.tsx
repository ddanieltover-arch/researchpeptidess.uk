import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatPrice, formatDate } from '../../lib/utils';
import {
  ShieldCheck,
  ShieldAlert,
  Play,
  RotateCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  Database,
  Truck,
  DollarSign,
  UserCheck,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const CommerceTestSuiteView: React.FC = () => {
  const {
    testSuiteReport,
    runCommerceTestSuite,
    sweepExpiredReservations,
    currency,
    addToast,
  } = useStore();

  const [isRunningTests, setIsRunningTests] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    pricing: true,
    state_machine: true,
    inventory: true,
  });

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRunTests = () => {
    setIsRunningTests(true);
    setTimeout(() => {
      try {
        const report = runCommerceTestSuite();
        addToast(
          report.overallPassed ? 'success' : 'error',
          report.overallPassed ? 'Test Suite Passed' : 'Test Failures Detected',
          `Ran ${report.totalTests} tests: ${report.passedTests} passed, ${report.failedTests} failed in ${report.durationMs.toFixed(1)}ms.`
        );
      } catch (err) {
        addToast('error', 'Test Suite Execution Error', (err as Error).message);
      } finally {
        setIsRunningTests(false);
      }
    }, 400);
  };

  const handleRunSweep = () => {
    const released = sweepExpiredReservations();
    addToast(
      'info',
      'Reservation Expiry Sweep Completed',
      `Processed active reservations: released ${released} expired order allocations back into available stock.`
    );
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Banner & Control Panel */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider">
              Commerce & Operations Engine Verification Suite
            </h3>
            {testSuiteReport && (
              <Badge variant={testSuiteReport.overallPassed ? 'success' : 'destructive'} size="sm">
                {testSuiteReport.overallPassed ? 'ALL TESTS PASSING' : 'FAILURES DETECTED'}
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 font-sans mt-1">
            Automated test assertions verifying the pricing engine, order state machine, inventory reservation locks, idempotency, shipping zones, and GxP role governance.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunSweep}
            className="text-xs font-mono h-9 gap-1.5"
          >
            <RotateCw className="h-3.5 w-3.5 text-amber-700" />
            <span>Sweep 24h Expired Reservations</span>
          </Button>

          <Button
            variant="gold"
            size="sm"
            onClick={handleRunTests}
            disabled={isRunningTests}
            className="text-xs font-mono h-9 gap-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400"
          >
            {isRunningTests ? (
              <>
                <RotateCw className="h-3.5 w-3.5 animate-spin text-amber-400" />
                <span>Running Test Suite...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 text-amber-400 fill-current" />
                <span>Run Commerce Test Suite</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* KPI Metrics */}
      {testSuiteReport && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-1 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-500">Total Assertions</span>
            <div className="text-2xl font-black text-slate-900">{testSuiteReport.totalTests}</div>
            <span className="text-[10px] text-slate-500 font-sans block">Unit & integration tests</span>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-1 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-emerald-800">Passed Tests</span>
            <div className="text-2xl font-black text-emerald-950">{testSuiteReport.passedTests}</div>
            <span className="text-[10px] text-emerald-700 font-sans block">100% compliant</span>
          </div>

          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 space-y-1 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-rose-800">Failed Tests</span>
            <div className="text-2xl font-black text-rose-950">{testSuiteReport.failedTests}</div>
            <span className="text-[10px] text-rose-700 font-sans block">0 allowed in production</span>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-1 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-500">Execution Time</span>
            <div className="text-2xl font-black text-amber-800">
              {testSuiteReport.durationMs.toFixed(1)}ms
            </div>
            <span className="text-[10px] text-slate-500 font-sans block">
              Last executed: {formatDate(testSuiteReport.executedAt)}
            </span>
          </div>
        </div>
      )}

      {/* Modules Breakdown */}
      {testSuiteReport ? (
        <div className="space-y-4">
          {testSuiteReport.modules.map((mod) => {
            const isExpanded = expandedModules[mod.id] ?? true;
            return (
              <div
                key={mod.id}
                className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs"
              >
                {/* Module Header */}
                <div
                  onClick={() => toggleModule(mod.id)}
                  className="p-4 bg-stone-50/80 border-b border-stone-200 flex items-center justify-between cursor-pointer hover:bg-stone-100/60 select-none"
                >
                  <div className="flex items-center gap-3">
                    {mod.passed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{mod.name}</span>
                        <Badge variant={mod.passed ? 'success' : 'destructive'} size="sm">
                          {mod.passed ? 'PASSED' : 'FAILED'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 font-sans mt-0.5">{mod.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-mono">
                      {mod.tests.filter((t) => t.passed).length}/{mod.tests.length} tests passed
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Test Cases Table */}
                {isExpanded && (
                  <div className="divide-y divide-stone-100">
                    {mod.tests.map((test) => (
                      <div key={test.id} className="p-3.5 flex items-start gap-3 hover:bg-stone-50/50">
                        {test.passed ? (
                          <div className="h-4 w-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] mt-0.5 shrink-0">
                            ✓
                          </div>
                        ) : (
                          <div className="h-4 w-4 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-[10px] mt-0.5 shrink-0">
                            ✕
                          </div>
                        )}

                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{test.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {test.durationMs ? `${test.durationMs.toFixed(2)}ms` : ''}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-sans">{test.description}</p>

                          {!test.passed && test.error && (
                            <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-200 text-rose-900 text-[11px] font-mono mt-2">
                              <strong>Assertion Failure:</strong> {test.error}
                            </div>
                          )}

                          {test.details && (
                            <div className="text-[10px] text-slate-500 font-mono bg-stone-50 p-2 rounded border border-stone-200 mt-1.5">
                              <pre className="overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(test.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-12 text-center space-y-3">
          <ShieldCheck className="h-10 w-10 text-amber-700 mx-auto opacity-70" />
          <h4 className="text-sm font-bold text-slate-900 uppercase">
            No Test Suite Execution in Current Session
          </h4>
          <p className="text-xs text-slate-500 font-sans max-w-md mx-auto">
            Click &ldquo;Run Commerce Test Suite&rdquo; above to execute the automated verification suite covering pricing, inventory locks, state transitions, idempotency, and GxP compliance.
          </p>
          <Button variant="gold" size="sm" onClick={handleRunTests}>
            Execute All Tests Now
          </Button>
        </div>
      )}
    </div>
  );
};
