import React from 'react';
import { useStore } from '../../context/StoreContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />,
          error: <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />,
          warning: <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />,
          info: <Info className="h-4 w-4 text-sky-600 shrink-0" />,
        };

        const borders = {
          success: 'border-emerald-200 bg-white',
          error: 'border-rose-200 bg-white',
          warning: 'border-amber-200 bg-white',
          info: 'border-sky-200 bg-white',
        };

        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all animate-in slide-in-from-bottom-3 duration-200',
              borders[toast.type]
            )}
          >
            <div className="mt-0.5">{icons[toast.type]}</div>
            <div className="flex-1 space-y-0.5">
              <h6 className="text-xs font-bold text-slate-900">{toast.title}</h6>
              <p className="text-xs text-slate-600 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded-sm"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
