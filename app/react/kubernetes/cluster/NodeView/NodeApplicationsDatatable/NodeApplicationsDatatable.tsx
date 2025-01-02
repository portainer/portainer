import { useCurrentStateAndParams } from '@uirouter/react';

import LaptopCode from '@/assets/ico/laptop-code.svg?c';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useApplications } from '@/react/kubernetes/applications/queries/useApplications';

import { Datatable, TableSettingsMenu } from '@@/datatables';
import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';
import { useTableStateWithStorage } from '@@/datatables/useTableState';
import {
  BasicTableSettings,
  refreshableSettings,
  RefreshableTableSettings,
} from '@@/datatables/types';

import { useColumns } from './columns';

interface TableSettings extends BasicTableSettings, RefreshableTableSettings {}

export function NodeApplicationsDatatable() {
  const tableState = useTableStateWithStorage<TableSettings>(
    'kube-node-apps',
    'Name',
    (set) => ({
      ...refreshableSettings(set),
    })
  );

  const envId = useEnvironmentId();
  const {
    params: { nodeName },
  } = useCurrentStateAndParams();
  const applicationsQuery = useApplications(envId, {
    nodeName,
    refetchInterval: tableState.autoRefreshRate * 1000,
  });
  const applications = applicationsQuery.data ?? [];

  const columns = useColumns();

  return (
    <Datatable
      dataset={applications}
      settingsManager={tableState}
      columns={columns}
      disableSelect
      title="Applications running on this node"
      titleIcon={LaptopCode}
      isLoading={applicationsQuery.isLoading}
      renderTableSettings={() => (
        <TableSettingsMenu>
          <TableSettingsMenuAutoRefresh
            value={tableState.autoRefreshRate}
            onChange={tableState.setAutoRefreshRate}
          />
        </TableSettingsMenu>
      )}
      data-cy="node-applications-datatable"
    />
  );
}
