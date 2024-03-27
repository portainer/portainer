import { CellContext, createColumnHelper } from '@tanstack/react-table';

import { Button } from '@@/buttons';

import { LogsStatus } from '../../types';

import { DecoratedJobResult, getTableMeta } from './types';

const columnHelper = createColumnHelper<DecoratedJobResult>();

export const columns = [
  columnHelper.accessor('Endpoint.Name', {
    header: 'Environment',
    meta: {
      className: 'w-1/2',
    },
  }),
  columnHelper.display({
    header: 'Actions',
    cell: ActionsCell,
    meta: {
      className: 'w-1/2',
    },
  }),
];

function ActionsCell({
  row: { original: item },
  table,
}: CellContext<DecoratedJobResult, unknown>) {
  const tableMeta = getTableMeta(table.options.meta);

  switch (item.LogsStatus) {
    case LogsStatus.Pending:
      return (
        <>
          Logs marked for collection, please wait until the logs are available.
        </>
      );

    case LogsStatus.Collected:
      return (
        <>
          <Button onClick={() => tableMeta.downloadLogs(item.EndpointId)}>
            Download logs
          </Button>
          <Button onClick={() => tableMeta.clearLogs(item.EndpointId)}>
            Clear logs
          </Button>
        </>
      );
    case LogsStatus.Idle:
    default:
      return (
        <Button onClick={() => tableMeta.collectLogs(item.EndpointId)}>
          Retrieve logs
        </Button>
      );
  }
}
