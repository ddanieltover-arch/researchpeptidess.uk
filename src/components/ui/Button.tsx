import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'gold' | 'dark' | 'brand' | 'sky';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-display font-semibold tracking-[0.12em] uppercase transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4353FF]/50 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer rounded-lg';

    const variants = {
      primary:
        'bg-[#4353FF] text-white hover:bg-[#3846E0] active:bg-[#2F3AC0] border border-[#4353FF] shadow-sm shadow-[#4353FF]/20',
      brand:
        'bg-[#4353FF] text-white hover:bg-[#3846E0] active:bg-[#2F3AC0] border border-[#4353FF] shadow-sm shadow-[#4353FF]/20',
      sky:
        'bg-[#0EA5E9] text-white hover:bg-[#0284C7] active:bg-[#0369A1] border border-[#0EA5E9] shadow-sm shadow-[#0EA5E9]/20',
      gold:
        'bg-[#4353FF] text-white hover:bg-[#3846E0] active:bg-[#2F3AC0] border border-[#4353FF]',
      secondary:
        'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200',
      outline:
        'border border-slate-300 bg-transparent text-slate-800 hover:bg-blue-50 hover:border-[#4353FF] hover:text-[#4353FF]',
      ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
      destructive:
        'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 border border-rose-700',
      dark: 'bg-[#0F172A] text-white hover:bg-[#4353FF] border border-[#0F172A]',
    };

    const sizes = {
      sm: 'h-8 px-3.5 text-xs gap-1.5',
      md: 'h-10 px-5 text-xs gap-2',
      lg: 'h-12 px-8 text-xs sm:text-sm gap-2.5',
      icon: 'h-10 w-10 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
