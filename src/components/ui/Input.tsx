import React from 'react';
import { cn } from '../../lib/utils';
import { toRenderableText } from '../../lib/react-text';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  mono?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, startIcon, endIcon, mono, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {startIcon && (
            <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
              {startIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'flex h-10 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-amber-600 focus-visible:ring-2 focus-visible:ring-amber-500/20 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-slate-400',
              startIcon && 'pl-9',
              endIcon && 'pr-9',
              mono && 'font-mono text-xs tracking-tight',
              error && 'border-rose-500 focus-visible:border-rose-600 focus-visible:ring-rose-500/20',
              className
            )}
            {...props}
          />
          {endIcon && (
            <div className="absolute right-3 text-slate-400 pointer-events-none flex items-center">
              {endIcon}
            </div>
          )}
        </div>
        {error ? <p className="text-xs text-rose-600 font-medium">{toRenderableText(error)}</p> : null}
        {helperText && !error && <p className="text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
