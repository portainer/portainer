import clsx from 'clsx';
import { PropsWithChildren } from 'react';
import { TableProps } from 'react-table';

import { useTableContext } from './TableContainer';

export function Table({
  children,
  className,
  role,
  style,
}: PropsWithChildren<TableProps>) {
  useTableContext();

  return (
    <div className="table-responsive">
      <table
        className={clsx(
          'table table-hover table-filters nowrap-cells',
          className
        )}
        role={role}
        style={style}
      >
        {children}
      </table>
    </div>
  );
}
