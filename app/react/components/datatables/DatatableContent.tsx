import { Row, Table as TableInstance } from '@tanstack/react-table';

import { AutomationTestingProps } from '@/types';

import { Table } from './Table';
import { DefaultType } from './types';

interface Props<D extends DefaultType> extends AutomationTestingProps {
  tableInstance: TableInstance<D>;
  renderRow(row: Row<D>): React.ReactNode;
  onSortChange?(colId: string, desc: boolean): void;
  isLoading?: boolean;
  emptyContentLabel?: string;
}

export function DatatableContent<D extends DefaultType>({
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
    <Table data-cy={dataCy} className="nowrap-cells">
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
