import { HeaderGroup, TableHeaderProps } from 'react-table';

import { TableHeaderCell } from './TableHeaderCell';

interface Props<D extends Record<string, unknown> = Record<string, unknown>> {
  headers: HeaderGroup<D>[];
  onSortChange(colId: string, desc: boolean): void;
}

export function TableHeaderRow<
  D extends Record<string, unknown> = Record<string, unknown>
>({
  headers,
  onSortChange,
  className,
  role,
  style,
}: Props<D> & TableHeaderProps) {
  return (
    <tr className={className} role={role} style={style}>
      {headers.map((column) => (
        <TableHeaderCell
          headerProps={{
            ...column.getHeaderProps({
              className: column.className,
            }),
          }}
          key={column.id}
          canSort={column.canSort}
          onSortClick={(desc) => {
            column.toggleSortBy(desc);
            onSortChange(column.id, desc);
          }}
          isSorted={column.isSorted}
          isSortedDesc={column.isSortedDesc}
          render={() => column.render('Header')}
          canFilter={column.canFilter}
          renderFilter={() => column.render('Filter')}
        />
      ))}
    </tr>
  );
}
