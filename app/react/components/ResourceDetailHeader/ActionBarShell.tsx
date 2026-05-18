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
        'border-gray-4 bg-gray-2 p-2',
        'th-dark:border-gray-7 th-dark:bg-gray-iron-10',
        'th-highcontrast:border-gray-11 th-highcontrast:bg-transparent',
        className
      )}
    >
      {children}
    </div>
  );
}
