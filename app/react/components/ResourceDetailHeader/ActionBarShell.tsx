import { ReactNode } from 'react';
import clsx from 'clsx';

interface Props {
  children: ReactNode;
  className?: string;
}

export function ActionBarShell({ children, className }: Props) {
  return (
    <div
      className={clsx(
        'flex items-center justify-between gap-2',
        'rounded-b-xl border-0 border-t border-solid',
        'border-t-[var(--border-widget)] bg-gray-2 px-6 py-2',
        'th-dark:bg-gray-iron-10',
        'th-highcontrast:bg-transparent',
        className
      )}
    >
      {children}
    </div>
  );
}
