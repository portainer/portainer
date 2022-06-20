import clsx from 'clsx';
import { PropsWithChildren } from 'react';

import { useTableContext } from './TableContainer';

interface Props {
  icon: string;
  label: string;
}

export function TableTitle({
  icon,
  label,
  children,
}: PropsWithChildren<Props>) {
  useTableContext();

  return (
    <div className="toolBar">
      <div className="toolBarTitle">
        <i className={clsx('space-right', 'fa', icon)} aria-hidden="true" />
        {label}
      </div>
      {children}
    </div>
  );
}
