import {
  useTable,
  useFilters,
  useSortBy,
  Column,
  TableState,
  usePagination,
} from 'react-table';

import { Table } from './Table';
import { multiple } from './filter-types';
import { NestedTable } from './NestedTable';
import { DatatableContent } from './DatatableContent';
import { defaultGetRowId } from './defaultGetRowId';

interface Props<D extends Record<string, unknown>> {
  dataset: D[];
  columns: readonly Column<D>[];

  getRowId?(row: D): string;
  emptyContentLabel?: string;
  initialTableState?: Partial<TableState<D>>;
  isLoading?: boolean;
  defaultSortBy?: string;
}

export function NestedDatatable<D extends Record<string, unknown>>({
  columns,
  dataset,
  getRowId = defaultGetRowId,
  emptyContentLabel,
  initialTableState = {},
  isLoading,
  defaultSortBy,
}: Props<D>) {
  const tableInstance = useTable<D>(
    {
      defaultCanFilter: false,
      columns,
      data: dataset,
      filterTypes: { multiple },
      initialState: {
        sortBy: defaultSortBy ? [{ id: defaultSortBy, desc: true }] : [],
        ...initialTableState,
      },
      autoResetSelectedRows: false,
      getRowId,
    },
    useFilters,
    useSortBy,
    usePagination
  );

  return (
    <NestedTable>
      <Table.Container>
        <DatatableContent<D>
          tableInstance={tableInstance}
          isLoading={isLoading}
          emptyContentLabel={emptyContentLabel}
          renderRow={(row, { key, className, role, style }) => (
            <Table.Row<D>
              cells={row.cells}
              key={key}
              className={className}
              role={role}
              style={style}
            />
          )}
        />
      </Table.Container>
    </NestedTable>
  );
}
