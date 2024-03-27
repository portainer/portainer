import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  TableOptions,
  TableState,
  useReactTable,
} from '@tanstack/react-table';

import { AutomationTestingProps } from '@/types';

import { defaultGetRowId } from './defaultGetRowId';
import { Table } from './Table';
import { NestedTable } from './NestedTable';
import { DatatableContent } from './DatatableContent';
import { BasicTableSettings, DefaultType } from './types';

interface Props<D extends DefaultType> extends AutomationTestingProps {
  dataset: D[];
  columns: TableOptions<D>['columns'];

  getRowId?(row: D): string;
  emptyContentLabel?: string;
  initialTableState?: Partial<TableState>;
  isLoading?: boolean;
  initialSortBy?: BasicTableSettings['sortBy'];

  /**
   * keyword to filter by
   */
  search?: string;

  'aria-label'?: string;
}

export function NestedDatatable<D extends DefaultType>({
  columns,
  dataset,
  getRowId = defaultGetRowId,
  emptyContentLabel,
  initialTableState = {},
  isLoading,
  initialSortBy,
  search,
  'data-cy': dataCy,
  'aria-label': ariaLabel,
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
    state: {
      globalFilter: search,
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
      <Table.Container noWidget>
        <DatatableContent<D>
          tableInstance={tableInstance}
          isLoading={isLoading}
          emptyContentLabel={emptyContentLabel}
          renderRow={(row) => <Table.Row<D> cells={row.getVisibleCells()} />}
          aria-label={ariaLabel}
          data-cy={dataCy}
        />
      </Table.Container>
    </NestedTable>
  );
}
