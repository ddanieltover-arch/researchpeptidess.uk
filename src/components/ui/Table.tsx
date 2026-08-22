import React from 'react';
import { cn } from '../../lib/utils';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {}

export const Table: React.FC<TableProps> = ({ className, children, ...props }) => (
  <div className="w-full overflow-x-auto rounded-lg border border-stone-200 bg-white">
    <table className={cn('w-full text-left text-xs text-slate-700', className)} {...props}>
      {children}
    </table>
  </div>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  children,
  ...props
}) => (
  <thead className={cn('bg-stone-50 border-b border-stone-200 text-slate-900 uppercase font-semibold tracking-wider text-[11px]', className)} {...props}>
    {children}
  </thead>
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  children,
  ...props
}) => (
  <tbody className={cn('divide-y divide-stone-100', className)} {...props}>
    {children}
  </tbody>
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className,
  children,
  ...props
}) => (
  <tr className={cn('hover:bg-stone-50/70 transition-colors', className)} {...props}>
    {children}
  </tr>
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  children,
  ...props
}) => (
  <th className={cn('px-4 py-3 font-semibold text-slate-800', className)} {...props}>
    {children}
  </th>
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  children,
  ...props
}) => (
  <td className={cn('px-4 py-3 text-slate-700 align-middle', className)} {...props}>
    {children}
  </td>
);
