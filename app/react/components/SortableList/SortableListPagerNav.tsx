import { ReactNode } from 'react';
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from 'lucide-react';
import clsx from 'clsx';

interface Props {
  safePage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function SortableListPagerNav({
  safePage,
  totalPages,
  onPageChange,
}: Props) {
  if (totalPages <= 1) return null;

  const pageNumbers = buildPageNumbers(totalPages, safePage);

  return (
    <div className="flex items-center gap-1">
      <PagerButton
        disabled={safePage === 0}
        onClick={() => onPageChange(0)}
        title="First page"
      >
        <ChevronsLeft className="h-3.5 w-3.5" />
      </PagerButton>
      <PagerButton
        disabled={safePage === 0}
        onClick={() => onPageChange(safePage - 1)}
        title="Previous page"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </PagerButton>
      {pageNumbers.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-1">
            …
          </span>
        ) : (
          <PagerButton
            key={p}
            active={p === safePage}
            onClick={() => onPageChange(p as number)}
          >
            {(p as number) + 1}
          </PagerButton>
        )
      )}
      <PagerButton
        disabled={safePage >= totalPages - 1}
        onClick={() => onPageChange(safePage + 1)}
        title="Next page"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </PagerButton>
      <PagerButton
        disabled={safePage >= totalPages - 1}
        onClick={() => onPageChange(totalPages - 1)}
        title="Last page"
      >
        <ChevronsRight className="h-3.5 w-3.5" />
      </PagerButton>
    </div>
  );
}

function buildPageNumbers(
  totalPages: number,
  current: number
): Array<number | '...'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }
  const pages: Array<number | '...'> = [0];
  if (current > 2) pages.push('...');
  for (
    let i = Math.max(1, current - 1);
    i <= Math.min(totalPages - 2, current + 1);
    i++
  ) {
    pages.push(i);
  }
  if (current < totalPages - 3) pages.push('...');
  pages.push(totalPages - 1);
  return pages;
}

const btnBase = clsx(
  'flex h-7 w-7 items-center justify-center rounded',
  'border border-solid border-gray-4 th-highcontrast:border-white th-dark:border-gray-7',
  'text-sm text-gray-7 th-highcontrast:text-white th-highcontrast:hover:text-black th-dark:text-gray-4',
  'transition-colors hover:bg-gray-3 th-highcontrast:bg-black th-highcontrast:hover:bg-white th-dark:hover:bg-gray-iron-9',
  'disabled:cursor-not-allowed disabled:opacity-40'
);

const btnActivePage = clsx(
  'border-blue-7 bg-blue-7 text-white hover:!bg-blue-6',
  'th-dark:border-blue-7 th-dark:bg-blue-7 th-dark:text-white',
  'th-highcontrast:bg-white th-highcontrast:!text-black hover:th-highcontrast:!bg-white'
);

interface PagerButtonProps {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  active?: boolean;
  children: ReactNode;
}

function PagerButton({
  onClick,
  disabled,
  title,
  active,
  children,
}: PagerButtonProps) {
  return (
    <button
      type="button"
      className={clsx(
        btnBase,
        active && btnActivePage,
        disabled && 'cursor-not-allowed'
      )}
      disabled={disabled}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}
