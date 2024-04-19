import { List } from 'lucide-react';
import { useEffect } from 'react';

import { EnvironmentId } from '@/react/portainer/environments/types';

import { Datatable } from '@@/datatables';
import { useTableState } from '@@/datatables/useTableState';
import { withMeta } from '@@/datatables/extend-options/withMeta';
import { useRepeater } from '@@/datatables/useRepeater';

import { LogsStatus } from '../../types';

import { DecoratedJobResult } from './types';
import { columns } from './columns';
import { createStore } from './datatable-store';

const tableKey = 'edge-job-results';
const store = createStore(tableKey);

export function ResultsDatatable({
  dataset,
  onCollectLogs,
  onClearLogs,
  onDownloadLogs,
  onRefresh,
}: {
  dataset: Array<DecoratedJobResult>;

  onCollectLogs(envId: EnvironmentId): void;
  onDownloadLogs(envId: EnvironmentId): void;
  onClearLogs(envId: EnvironmentId): void;
  onRefresh(): void;
}) {
  const anyCollecting = dataset.some(
    (r) => r.LogsStatus === LogsStatus.Pending
  );
  const tableState = useTableState(store, tableKey);

  const { setAutoRefreshRate } = tableState;

  useEffect(() => {
    setAutoRefreshRate(anyCollecting ? 5 : 0);
  }, [anyCollecting, setAutoRefreshRate]);

  useRepeater(tableState.autoRefreshRate, onRefresh);
  return (
    <Datatable
      disableSelect
      columns={columns}
      dataset={dataset}
      title="Results"
      titleIcon={List}
      settingsManager={tableState}
      extendTableOptions={withMeta({
        table: 'edge-job-results',
        collectLogs: handleCollectLogs,
        downloadLogs: onDownloadLogs,
        clearLogs: onClearLogs,
      })}
      data-cy="edge-job-results-datatable"
    />
  );

  function handleCollectLogs(envId: EnvironmentId) {
    onCollectLogs(envId);
  }
}
