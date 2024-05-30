import { CellContext, createColumnHelper } from '@tanstack/react-table';

import { Button } from '@@/buttons';

import { LogsStatus } from '../../types';
import { useDownloadLogsMutation } from '../../queries/jobResults/useDownloadLogsMutation';
import { useClearLogsMutation } from '../../queries/jobResults/useClearLogsMutation';
import { useCollectLogsMutation } from '../../queries/jobResults/useCollectLogsMutation';

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
  const id = tableMeta.jobId;

  const downloadLogsMutation = useDownloadLogsMutation(id);
  const clearLogsMutations = useClearLogsMutation(id);
  const collectLogsMutation = useCollectLogsMutation(id);

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
          <Button
            onClick={() => downloadLogsMutation.mutate(item.EndpointId)}
            data-cy={`edge-job-download-logs-${item.Endpoint?.Name}`}
          >
            Download logs
          </Button>
          <Button
            onClick={() => clearLogsMutations.mutate(item.EndpointId)}
            data-cy={`edge-job-clear-logs-${item.Endpoint?.Name}`}
          >
            Clear logs
          </Button>
        </>
      );
    case LogsStatus.Idle:
    default:
      return (
        <Button
          onClick={() => collectLogsMutation.mutate(item.EndpointId)}
          data-cy={`edge-job-retrieve-logs-${item.Endpoint?.Name}`}
        >
          Retrieve logs
        </Button>
      );
  }
}
