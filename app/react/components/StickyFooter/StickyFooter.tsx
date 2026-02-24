import { PropsWithChildren } from 'react';
import clsx from 'clsx';

import styles from './StickyFooter.module.css';

interface Props {
  className?: string;
}

export function StickyFooter({
  className,
  children,
}: PropsWithChildren<Props>) {
  return (
    <div
      className={clsx(
        styles.actionBar,
        'fixed bottom-0 right-0 z-40 h-16',
        'flex items-center px-6',
        'bg-[var(--bg-widget-color)] border-t border-[var(--border-widget-color)]',
        'shadow-[0_-2px_5px_rgba(0,0,0,0.1)]',
        className
      )}
    >
      {children}
    </div>
  );
}
