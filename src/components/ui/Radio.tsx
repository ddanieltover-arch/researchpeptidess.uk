import React from 'react';
import { cn } from '../../lib/utils';

export interface RadioOption {
  value: string;
  title: string;
  description?: string;
  badge?: string;
  icon?: React.ReactNode;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  options,
  value,
  onChange,
  className,
}) => {
  return (
    <div className={cn('space-y-2.5', className)}>
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <label
            key={opt.value}
            className={cn(
              'relative flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-all',
              isSelected
                ? 'border-amber-600 bg-amber-50/40 shadow-xs ring-1 ring-amber-500/20'
                : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50'
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={isSelected}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-stone-400 bg-white peer-checked:border-amber-600">
              {isSelected && <div className="h-2 w-2 rounded-full bg-amber-600" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {opt.icon && <span className="text-slate-700">{opt.icon}</span>}
                  <span className="text-sm font-semibold text-slate-900">{opt.title}</span>
                </div>
                {opt.badge && (
                  <span className="rounded-xs bg-amber-100 px-2 py-0.5 text-xs font-bold tracking-wide text-amber-900 border border-amber-200">
                    {opt.badge}
                  </span>
                )}
              </div>
              {opt.description && (
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">{opt.description}</p>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
};
