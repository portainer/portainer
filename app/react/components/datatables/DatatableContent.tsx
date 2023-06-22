import { Row, Table as TableInstance } from '@tanstack/react-table';

import { AutomationTestingProps } from '@/types';

import { Table } from './Table';

interface Props<D extends Record<string, unknown>>
  extends AutomationTestingProps {
  tableInstance: TableInstance<D>;
  renderRow(row: Row<D>): React.ReactNode;
  onSortChange?(colId: string, desc: boolean): void;
  isLoading?: boolean;
  emptyContentLabel?: string;
}

export function DatatableContent<D extends Record<string, unknown>>({
  tableInstance,
  renderRow,
  onSortChange,
  isLoading,
  emptyContentLabel,
  'data-cy': dataCy,
}: Props<D>) {
  const headerGroups = tableInstance.getHeaderGroups();
  const pageRowModel = tableInstance.getPaginationRowModel();

  return (
    <Table data-cy={dataCy}>
      <thead>
        {headerGroups.map((headerGroup) => (
          <Table.HeaderRow<D>
            key={headerGroup.id}
            headers={headerGroup.headers}
            onSortChange={onSortChange}
          />
        ))}
      </thead>
      <tbody>
        <Table.Content<D>
          rows={pageRowModel.rows}
          isLoading={isLoading}
          emptyContent={emptyContentLabel}
          renderRow={renderRow}
        />
      </tbody>
    </Table>
  );
}
