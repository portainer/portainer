import { Row } from '@tanstack/react-table';
import { ReactNode } from 'react';

import { ExpandableDatatableTableRow } from './ExpandableDatatableRow';
import {
  Datatable,
  Props as DatatableProps,
  PaginationProps,
} from './Datatable';

interface Props<D extends Record<string, unknown>>
  extends Omit<DatatableProps<D>, 'renderRow' | 'expandable'> {
  renderSubRow(row: Row<D>): ReactNode;
  expandOnRowClick?: boolean;
}

export function ExpandableDatatable<D extends Record<string, unknown>>({
  renderSubRow,
  getRowCanExpand = () => true,
  expandOnRowClick,
  ...props
}: Props<D> & PaginationProps) {
  return (
    <Datatable<D>
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
