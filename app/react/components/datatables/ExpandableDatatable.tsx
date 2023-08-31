import { Row, TableMeta } from '@tanstack/react-table';
import { ReactNode } from 'react';

import { ExpandableDatatableTableRow } from './ExpandableDatatableRow';
import {
  Datatable,
  Props as DatatableProps,
  PaginationProps,
} from './Datatable';
import { DefaultType } from './types';

interface Props<
  D extends DefaultType,
  TMeta extends TableMeta<D> = TableMeta<D>
> extends Omit<DatatableProps<D, TMeta>, 'renderRow' | 'expandable'> {
  renderSubRow(row: Row<D>): ReactNode;
  expandOnRowClick?: boolean;
}

export function ExpandableDatatable<
  D extends DefaultType,
  TMeta extends TableMeta<D> = TableMeta<D>
>({
  renderSubRow,
  getRowCanExpand = () => true,
  expandOnRowClick,
  ...props
}: Props<D, TMeta> & PaginationProps) {
  return (
    <Datatable<D, TMeta>
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      getRowCanExpand={getRowCanExpand}
      renderRow={(row) => (
        <ExpandableDatatableTableRow<D>
          row={row}
          renderSubRow={renderSubRow}
          expandOnClick={expandOnRowClick}
        />
      )}
    />
  );
}
