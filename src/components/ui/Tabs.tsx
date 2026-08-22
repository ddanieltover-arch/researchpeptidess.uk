import React from 'react';
import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div className={cn('flex border-b border-stone-200 space-x-1 overflow-x-auto no-scrollbar', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap',
              isActive
                ? 'border-amber-600 text-slate-950 bg-amber-50/30'
                : 'border-transparent text-slate-500 hover:border-stone-300 hover:text-slate-800'
            )}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'rounded-xs px-1.5 py-0.2 text-[10px] font-mono font-bold',
                  isActive ? 'bg-amber-600 text-white' : 'bg-stone-200 text-slate-700'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
