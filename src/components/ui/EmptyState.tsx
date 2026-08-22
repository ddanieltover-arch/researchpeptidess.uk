import React from 'react';
import { cn } from '../../lib/utils';
import { FlaskConical } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50/50 p-12 text-center',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-slate-500 mb-4 border border-stone-200">
        {icon || <FlaskConical className="h-6 w-6" />}
      </div>
      <h4 className="text-base font-bold text-slate-900 tracking-tight">{title}</h4>
      <p className="mt-1 text-xs text-slate-500 max-w-sm leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} className="mt-5">
          {actionText}
        </Button>
      )}
    </div>
  );
};

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-stone-200/80', className)}
      {...props}
    />
  );
};
