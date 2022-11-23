import { Row, TableInstance, TableRowProps } from 'react-table';

import { Table } from './Table';

interface Props<D extends Record<string, unknown>> {
  tableInstance: TableInstance<D>;
  renderRow(row: Row<D>, rowProps: TableRowProps): React.ReactNode;
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
}: Props<D>) {
  const { getTableProps, getTableBodyProps, headerGroups, page, prepareRow } =
    tableInstance;

  const tableProps = getTableProps();
  const tbodyProps = getTableBodyProps();
  return (
    <Table
      className={tableProps.className}
      role={tableProps.role}
      style={tableProps.style}
    >
      <thead>
        {headerGroups.map((headerGroup) => {
          const { key, className, role, style } =
            headerGroup.getHeaderGroupProps();
          return (
            <Table.HeaderRow<D>
              key={key}
              className={className}
              role={role}
              style={style}
              headers={headerGroup.headers}
              onSortChange={onSortChange}
            />
          );
        })}
      </thead>
      <tbody
        className={tbodyProps.className}
        role={tbodyProps.role}
        style={tbodyProps.style}
      >
        <Table.Content<D>
          rows={page}
          isLoading={isLoading}
          prepareRow={prepareRow}
          emptyContent={emptyContentLabel}
          renderRow={renderRow}
        />
      </tbody>
    </Table>
  );
}
