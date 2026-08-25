import React, { useEffect } from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'sm' | 'md' | 'lg';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'md',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const widths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-2xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 flex min-h-0 pl-10">
        <div
          className={cn(
            'flex h-full min-h-0 w-screen flex-col bg-white shadow-2xl border-l border-stone-200 animate-in slide-in-from-right duration-250',
            widths[width]
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50/50">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">{title}</h2>
              {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-slate-400 hover:bg-stone-200 hover:text-slate-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="max-h-[48vh] shrink-0 overflow-y-auto border-t border-stone-200 bg-stone-50/80 p-6">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
