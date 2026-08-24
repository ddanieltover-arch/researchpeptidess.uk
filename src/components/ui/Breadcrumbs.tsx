import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronRight, Home } from 'lucide-react';
import { AppLink } from './AppLink';
import { ROUTES } from '../../lib/routing';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className }) => {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center space-x-1.5 text-xs text-slate-500', className)}>
      <AppLink href={ROUTES.home} className="flex items-center gap-1 hover:text-slate-900 transition-colors">
        <Home className="h-3.5 w-3.5" />
        <span>Home</span>
      </AppLink>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={`${item.label}-${index}`}>
            <ChevronRight className="h-3 w-3 text-stone-400 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-900 truncate max-w-[200px] md:max-w-none">
                {item.label}
              </span>
            ) : item.href ? (
              <AppLink href={item.href} className="hover:text-slate-900 transition-colors truncate max-w-[150px]">
                {item.label}
              </AppLink>
            ) : (
              <button
                type="button"
                onClick={item.onClick}
                className="hover:text-slate-900 transition-colors truncate max-w-[150px]"
              >
                {item.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
