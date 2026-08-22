import React from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export interface AlertProps {
  variant?: 'info' | 'warning' | 'error' | 'success' | 'research';
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onDismiss,
  className,
}) => {
  const configs = {
    info: {
      container: 'bg-sky-50/80 border-sky-200 text-sky-950',
      icon: <Info className="h-4 w-4 text-sky-700 shrink-0" />,
      titleColor: 'text-sky-900',
    },
    warning: {
      container: 'bg-amber-50/90 border-amber-300 text-amber-950',
      icon: <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />,
      titleColor: 'text-amber-900',
    },
    error: {
      container: 'bg-rose-50/80 border-rose-200 text-rose-950',
      icon: <AlertCircle className="h-4 w-4 text-rose-700 shrink-0" />,
      titleColor: 'text-rose-900',
    },
    success: {
      container: 'bg-emerald-50/80 border-emerald-200 text-emerald-950',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />,
      titleColor: 'text-emerald-900',
    },
    research: {
      container: 'bg-slate-900 border-slate-800 text-stone-100 shadow-xs',
      icon: <Info className="h-4 w-4 text-amber-400 shrink-0" />,
      titleColor: 'text-amber-400 font-mono tracking-wide',
    },
  };

  const current = configs[variant];

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 rounded-lg border p-4 text-xs leading-relaxed',
        current.container,
        className
      )}
    >
      <div className="mt-0.5">{current.icon}</div>
      <div className="flex-1 space-y-1">
        {title && <h5 className={cn('font-semibold', current.titleColor)}>{title}</h5>}
        <div className="text-current opacity-95">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
