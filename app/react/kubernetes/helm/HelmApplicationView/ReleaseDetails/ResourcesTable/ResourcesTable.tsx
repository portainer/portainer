import { useCurrentStateAndParams } from '@uirouter/react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useHelmRelease } from '@/react/kubernetes/helm/helmReleaseQueries/useHelmRelease';

import { Datatable, TableSettingsMenu } from '@@/datatables';
import {
  createPersistedStore,
  refreshableSettings,
  TableSettingsWithRefreshable,
} from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';
import { Widget } from '@@/Widget';
import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';
import { TextTip } from '@@/Tip/TextTip';

import { columns } from './columns';
import { useResourceRows } from './useResourceRows';

const storageKey = 'helm-resources';

export function createStore(storageKey: string) {
  return createPersistedStore<TableSettingsWithRefreshable>(
    storageKey,
    'name',
    (set) => ({
      ...refreshableSettings(set),
    })
  );
}

const settingsStore = createStore('helm-resources');

export function ResourcesTable() {
  const environmentId = useEnvironmentId();
  const { params } = useCurrentStateAndParams();
  const { name, namespace, revision } = params;
  const revisionNumber = revision ? parseInt(revision, 10) : undefined;

  const tableState = useTableState(settingsStore, storageKey);
  const helmReleaseQuery = useHelmRelease(environmentId, name, namespace, {
    showResources: true,
    refetchInterval: tableState.autoRefreshRate * 1000,
    revision: revisionNumber,
  });
  const rows = useResourceRows(helmReleaseQuery.data?.info?.resources);

  return (
    <Widget>
      <Datatable
        // no widget to avoid extra padding from app/react/components/datatables/TableContainer.tsx
        noWidget
        isLoading={helmReleaseQuery.isLoading}
        dataset={rows}
        columns={columns}
        includeSearch
        settingsManager={tableState}
        emptyContentLabel="No resources found"
        title={
          <TextTip inline color="blue" className="!text-xs">
            Only resources currently in the cluster will be displayed.
          </TextTip>
        }
        disableSelect
        getRowId={(row) => row.id}
        data-cy="helm-resources-datatable"
        renderTableSettings={() => (
          <TableSettingsMenu>
            <TableSettingsMenuAutoRefresh
              value={tableState.autoRefreshRate}
              onChange={(value) => tableState.setAutoRefreshRate(value)}
            />
          </TableSettingsMenu>
        )}
      />
    </Widget>
  );
}
