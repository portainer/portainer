import clsx from 'clsx';
import { PropsWithChildren } from 'react';

import { useTableContext } from './TableContainer';

interface Props {
  className?: string;
}

export function TableActions({
  children,
  className,
}: PropsWithChildren<Props>) {
  useTableContext();

  return <div className={clsx('actionBar', className)}>{children}</div>;
}
