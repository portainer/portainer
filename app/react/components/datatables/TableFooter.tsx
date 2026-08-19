import clsx from 'clsx';
import { PropsWithChildren } from 'react';

export function TableFooter({
  children,
  className,
}: PropsWithChildren<unknown> & { className?: string }) {
  return <footer className={clsx('footer', className)}>{children}</footer>;
}
