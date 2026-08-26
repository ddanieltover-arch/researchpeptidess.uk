import React from 'react';
import { cn } from '../../lib/utils';
import { isPlainDataObject, toRenderableText } from '../../lib/react-text';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'gold' | 'scientific' | 'success' | 'warning' | 'destructive' | 'neutral' | 'outline' | 'brand' | 'sky';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'brand',
  size = 'md',
  children,
  ...props
}) => {
  const variants = {
    brand: 'bg-[#4353FF] text-white border-[#4353FF] font-bold uppercase tracking-wider',
    sky: 'bg-sky-50 text-sky-800 border-sky-300 font-bold uppercase tracking-wider',
    gold: 'bg-blue-50 text-[#4353FF] border-blue-200 font-bold uppercase tracking-wider',
    scientific: 'bg-[#0F172A] text-white border-[#0F172A] font-bold tracking-wider uppercase',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold uppercase tracking-wider',
    warning: 'bg-amber-50 text-amber-800 border-amber-300 font-bold uppercase',
    destructive: 'bg-rose-50 text-rose-800 border-rose-200 font-bold uppercase',
    neutral: 'bg-slate-100 text-slate-800 border-slate-200 font-bold uppercase tracking-wider',
    outline: 'bg-transparent text-slate-800 border-slate-300 font-bold uppercase tracking-wider',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[9px] leading-tight rounded-md font-display',
    md: 'px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md font-display',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center border whitespace-nowrap select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isPlainDataObject(children) ? toRenderableText(children) : children}
    </span>
  );
};
