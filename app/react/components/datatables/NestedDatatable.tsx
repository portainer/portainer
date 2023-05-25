import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  TableOptions,
  TableState,
  useReactTable,
} from '@tanstack/react-table';

import { defaultGetRowId } from './defaultGetRowId';
import { Table } from './Table';
import { NestedTable } from './NestedTable';
import { DatatableContent } from './DatatableContent';
import { BasicTableSettings } from './types';

interface Props<D extends Record<string, unknown>> {
  dataset: D[];
  columns: TableOptions<D>['columns'];

  getRowId?(row: D): string;
  emptyContentLabel?: string;
  initialTableState?: Partial<TableState>;
  isLoading?: boolean;
  initialSortBy?: BasicTableSettings['sortBy'];
}

export function NestedDatatable<D extends Record<string, unknown>>({
  columns,
  dataset,
  getRowId = defaultGetRowId,
  emptyContentLabel,
  initialTableState = {},
  isLoading,
  initialSortBy,
}: Props<D>) {
  const tableInstance = useReactTable<D>({
    columns,
    data: dataset,
    initialState: {
      sorting: initialSortBy ? [initialSortBy] : [],
      ...initialTableState,
    },
    defaultColumn: {
      enableColumnFilter: false,
      enableHiding: false,
    },
    getRowId,
    autoResetExpanded: false,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <NestedTable>
      <Table.Container>
        <DatatableContent<D>
          tableInstance={tableInstance}
          isLoading={isLoading}
          emptyContentLabel={emptyContentLabel}
          renderRow={(row) => <Table.Row<D> cells={row.getVisibleCells()} />}
        />
      </Table.Container>
    </NestedTable>
  );
}
