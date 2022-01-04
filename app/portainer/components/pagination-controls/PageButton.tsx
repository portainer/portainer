import clsx from 'clsx';
import { ReactNode } from 'react';

interface Props {
  active?: boolean;
  children: ReactNode;
  disabled?: boolean;
  onPageChange(page: number): void;
  page: number | '...';
}

export function PageButton({
  children,
  page,
  disabled,
  active,
  onPageChange,
}: Props) {
  return (
    <li className={clsx({ disabled, active })}>
      <button
        type="button"
        onClick={() => typeof page === 'number' && onPageChange(page)}
      >
        {children}
      </button>
    </li>
  );
}
