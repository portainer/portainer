import { Row } from 'react-table';
import { ReactNode } from 'react';

import { ExpandableDatatableTableRow } from './ExpandableDatatableRow';
import { Datatable, Props as DatatableProps } from './Datatable';

interface Props<D extends Record<string, unknown>>
  extends Omit<DatatableProps<D>, 'renderRow' | 'expandable'> {
  renderSubRow(row: Row<D>): ReactNode;
}

export function ExpandableDatatable<D extends Record<string, unknown>>({
  renderSubRow,
  ...props
}: Props<D>) {
  return (
    <Datatable<D>
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      expandable
      renderRow={(row, { key, className, role, style }) => (
        <ExpandableDatatableTableRow<D>
          key={key}
          row={row}
          className={className}
          role={role}
          style={style}
          renderSubRow={renderSubRow}
        />
      )}
    />
  );
}
