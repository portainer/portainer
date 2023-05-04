import { Header, flexRender } from '@tanstack/react-table';

import { filterHOC } from './Filter';
import { TableHeaderCell } from './TableHeaderCell';

interface Props<D extends Record<string, unknown> = Record<string, unknown>> {
  headers: Header<D, unknown>[];
  onSortChange?(colId: string, desc: boolean): void;
}

export function TableHeaderRow<
  D extends Record<string, unknown> = Record<string, unknown>
>({ headers, onSortChange }: Props<D>) {
  return (
    <tr>
      {headers.map((header) => {
        const sortDirection = header.column.getIsSorted();
        const {
          meta: { className, width } = { className: '', width: undefined },
        } = header.column.columnDef;

        return (
          <TableHeaderCell
            className={className}
            style={{
              width,
            }}
            key={header.id}
            canSort={header.column.getCanSort()}
            onSortClick={(desc) => {
              header.column.toggleSorting(desc);
              if (onSortChange) {
                onSortChange(header.id, desc);
              }
            }}
            isSorted={!!sortDirection}
            isSortedDesc={sortDirection ? sortDirection === 'desc' : false}
            render={() =>
              flexRender(header.column.columnDef.header, header.getContext())
            }
            renderFilter={
              header.column.getCanFilter()
                ? () =>
                    flexRender(
                      header.column.columnDef.meta?.filter ||
                        filterHOC('Filter'),
                      {
                        column: header.column,
                      }
                    )
                : undefined
            }
          />
        );
      })}
    </tr>
  );
}
