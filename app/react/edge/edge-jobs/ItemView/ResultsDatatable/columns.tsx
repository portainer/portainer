import { CellContext, createColumnHelper } from '@tanstack/react-table';

import i18n from '@/i18n';
import { sortOptionsFromColumns } from '@/react/common/api/sort.types';

import { Button } from '@@/buttons';

import { JobResult, LogsStatus } from '../../types';
import { useDownloadLogsMutation } from '../../queries/jobResults/useDownloadLogsMutation';
import { useClearLogsMutation } from '../../queries/jobResults/useClearLogsMutation';
import { useCollectLogsMutation } from '../../queries/jobResults/useCollectLogsMutation';

import { getTableMeta } from './types';

const columnHelper = createColumnHelper<JobResult>();

export const columns = [
  columnHelper.accessor('EndpointName', {
    header: () => i18n.t('edge.jobs.columns.environment'),
    meta: {
      className: 'w-1/2',
    },
  }),
  columnHelper.display({
    id: 'actions',
    header: () => i18n.t('edge.jobs.columns.actions'),
    cell: ActionsCell,
    meta: {
      className: 'w-1/2',
    },
  }),
];

function ActionsCell({
  row: { original: item },
  table,
}: CellContext<JobResult, unknown>) {
  const tableMeta = getTableMeta(table.options.meta);
  const id = tableMeta.jobId;

  const downloadLogsMutation = useDownloadLogsMutation(id);
  const clearLogsMutations = useClearLogsMutation(id);
  const collectLogsMutation = useCollectLogsMutation(id);

  switch (item.LogsStatus) {
    case LogsStatus.Pending:
      return (
        <>{i18n.t('edge.jobs.results.logs_pending')}</>
      );

    case LogsStatus.Collected:
      return (
        <>
          <Button
            onClick={() => downloadLogsMutation.mutate(item.EndpointId)}
            data-cy={`edge-job-download-logs-${item.EndpointName}`}
          >
            {i18n.t('edge.jobs.results.download_logs')}
          </Button>
          <Button
            onClick={() => clearLogsMutations.mutate(item.EndpointId)}
            data-cy={`edge-job-clear-logs-${item.EndpointName}`}
          >
            {i18n.t('edge.jobs.results.clear_logs')}
          </Button>
        </>
      );
    case LogsStatus.Idle:
    default:
      return (
        <Button
          onClick={() => collectLogsMutation.mutate(item.EndpointId)}
          data-cy={`edge-job-retrieve-logs-${item.EndpointName}`}
        >
          {i18n.t('edge.jobs.results.retrieve_logs')}
        </Button>
      );
  }
}

export const sortOptions = sortOptionsFromColumns(columns);
