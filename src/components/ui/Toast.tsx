import React from 'react';
import { useStore } from '../../context/StoreContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toRenderableText } from '../../lib/react-text';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 bottom-[calc(var(--mobile-bottom-nav-height)+1rem)] z-50 flex w-full max-w-sm flex-col gap-2 lg:bottom-4">
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
              <h6 className="text-xs font-bold text-slate-900">{toRenderableText(toast.title)}</h6>
              <p className="text-xs text-slate-600 leading-relaxed">{toRenderableText(toast.message)}</p>
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
