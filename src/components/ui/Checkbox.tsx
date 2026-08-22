import React from 'react';
import { cn } from '../../lib/utils';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, checked, onChange, ...props }, ref) => {
    const inputId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex items-start gap-2.5">
        <div className="relative flex items-center justify-center pt-0.5">
          <input
            id={inputId}
            type="checkbox"
            ref={ref}
            checked={checked}
            onChange={onChange}
            className="peer sr-only"
            {...props}
          />
          <label
            htmlFor={inputId}
            className={cn(
              'h-4 w-4 shrink-0 rounded-xs border border-stone-400 bg-white shadow-2xs transition-all cursor-pointer peer-checked:border-amber-600 peer-checked:bg-amber-600 peer-focus-visible:ring-2 peer-focus-visible:ring-amber-500/30 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 flex items-center justify-center',
              error && 'border-rose-500',
              className
            )}
          >
            {checked && <Check className="h-3 w-3 text-white stroke-[3]" />}
          </label>
        </div>
        {(label || description) && (
          <div className="space-y-0.5 leading-none">
            {label && (
              <label htmlFor={inputId} className="text-sm font-medium text-slate-800 cursor-pointer select-none">
                {label}
              </label>
            )}
            {description && <p className="text-xs text-slate-500">{description}</p>}
            {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
