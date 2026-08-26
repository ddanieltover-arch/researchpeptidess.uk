import React from 'react';
import { cn } from '../../lib/utils';
import { Check } from 'lucide-react';
import { toRenderableText } from '../../lib/react-text';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, checked, onChange, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    return (
      <label
        htmlFor={inputId}
        className="flex items-start gap-2.5 cursor-pointer select-none has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
      >
        <span className="relative flex items-center justify-center pt-0.5">
          <input
            id={inputId}
            type="checkbox"
            ref={ref}
            checked={checked}
            onChange={onChange}
            className="peer sr-only"
            {...props}
          />
          <span
            aria-hidden="true"
            className={cn(
              'h-4 w-4 shrink-0 rounded-xs border border-stone-400 bg-white shadow-2xs transition-all peer-checked:border-amber-600 peer-checked:bg-amber-600 peer-focus-visible:ring-2 peer-focus-visible:ring-amber-500/30 flex items-center justify-center',
              error && 'border-rose-500',
              className
            )}
          >
            {checked && <Check className="h-3 w-3 text-white stroke-[3]" />}
          </span>
        </span>
        {(label || description) && (
          <span className="block space-y-0.5 leading-none">
            {label && (
              <span className="block text-sm font-medium text-slate-800">{label}</span>
            )}
            {description && <span className="block text-xs text-slate-500">{description}</span>}
            {error ? <span className="block text-xs text-rose-600 font-medium">{toRenderableText(error)}</span> : null}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
