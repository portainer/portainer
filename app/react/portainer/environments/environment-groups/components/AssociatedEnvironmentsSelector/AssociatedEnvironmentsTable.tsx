import { createColumnHelper } from '@tanstack/react-table';
import clsx from 'clsx';
import { truncate } from 'lodash';
import { useMemo } from 'react';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { AutomationTestingProps } from '@/types';

import { useTableStateWithoutStorage } from '@@/datatables/useTableState';
import { Datatable, TableRow } from '@@/datatables';
import { Badge } from '@@/Badge';
import { Widget } from '@@/Widget';

import { EnvironmentTableData } from './types';

const columnHelper = createColumnHelper<EnvironmentTableData>();

interface Props extends AutomationTestingProps {
  title: string;
  environments: Array<EnvironmentTableData>;
  onClickRow?: (env: EnvironmentTableData) => void;
  highlightIds?: Array<EnvironmentId>;
}

export function AssociatedEnvironmentsTable({
  title,
  environments,
  onClickRow,
  highlightIds = [],
  'data-cy': dataCy,
}: Props) {
  const tableState = useTableStateWithoutStorage('Name');
  const columns = useMemo(() => buildColumns(highlightIds), [highlightIds]);

  return (
    <Widget className="flex-1 flex flex-col">
      <div
        className={clsx(
          'h-full flex flex-col',
          '[&_section.datatable]:flex-1 [&_section.datatable]:flex [&_section.datatable]:flex-col',
          '[&_.footer]:!mt-auto'
        )}
      >
        <Datatable<EnvironmentTableData>
          // noWidget to avoid padding issues with TableContainer
          noWidget
          title={title}
          columns={columns}
          settingsManager={tableState}
          dataset={environments}
          renderRow={(row) => (
            <TableRow<EnvironmentTableData>
              cells={row.getVisibleCells()}
              onClick={onClickRow ? () => onClickRow(row.original) : undefined}
            />
          )}
          disableSelect
          data-cy={dataCy || 'environment-table'}
        />
      </div>
    </Widget>
  );
}

function buildColumns(highlightIds: Array<EnvironmentId>) {
  return [
    columnHelper.accessor('Name', {
      header: 'Name',
      id: 'Name',
      cell: ({ getValue, row }) => (
        <span className="flex items-center gap-2">
          <span title={getValue()}>{truncate(getValue(), { length: 64 })}</span>
          {highlightIds.includes(row.original.Id) && (
            <Badge type="muted" data-cy="unsaved-badge">
              Unsaved
            </Badge>
          )}
        </span>
      ),
    }),
  ];
}
