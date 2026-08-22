import React from 'react';
import { Button } from './Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only sm:inline text-xs">Previous</span>
      </Button>

      <div className="flex items-center space-x-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`h-8 w-8 rounded-md text-xs font-semibold transition-all ${
              p === currentPage
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-700 hover:bg-stone-100'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <span className="sr-only sm:not-sr-only sm:inline text-xs">Next</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
