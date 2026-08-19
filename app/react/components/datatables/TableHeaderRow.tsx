import {
  Header,
  flexRender,
  TableMeta,
  ColumnMeta,
} from '@tanstack/react-table';

import { filterHOC } from './Filter';
import { TableHeaderCell } from './TableHeaderCell';
import { DefaultType } from './types';

interface Props<D extends DefaultType = DefaultType> {
  headers: Header<D, unknown>[];
  onSortChange?(colId: string, desc: boolean): void;
  tableMeta: TableMeta<D> | undefined;
}

export function TableHeaderRow<D extends DefaultType = DefaultType>({
  headers,
  onSortChange,
  tableMeta,
}: Props<D>) {
  return (
    <tr>
      {headers.map((header) => {
        const sortDirection = header.column.getIsSorted();
        const { className, filter, width } = parseMeta(
          header.column.columnDef.meta
        );

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
                    flexRender(filter, {
                      column: header.column,
                      tableMeta,
                    })
                : undefined
            }
          />
        );
      })}
    </tr>
  );
}

function parseMeta<D extends DefaultType = DefaultType>(
  meta: ColumnMeta<D, unknown> | undefined
) {
  if (!meta) {
    return {
      className: '',
      width: undefined,
      filter: filterHOC('Filter'),
    };
  }

  const className =
    'className' in meta && typeof meta.className === 'string'
      ? meta.className
      : undefined;
  const width =
    'width' in meta && typeof meta.width === 'string' ? meta.width : undefined;
  const filter =
    'filter' in meta && typeof meta.filter === 'function'
      ? meta.filter
      : filterHOC('Filter');

  return { className, width, filter };
}
