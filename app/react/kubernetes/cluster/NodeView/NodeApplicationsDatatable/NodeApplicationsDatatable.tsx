import LaptopCode from '@/assets/ico/laptop-code.svg?c';
import { useCurrentStateAndParams } from '@uirouter/react';
import { Datatable, TableSettingsMenu } from '@@/datatables';
import { useRepeater } from '@@/datatables/useRepeater';
import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';
import { useTableStateWithStorage } from '@@/datatables/useTableState';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import {
  BasicTableSettings,
  refreshableSettings,
  RefreshableTableSettings,
} from '@@/datatables/types';

import { useColumns } from './columns';
import { useAllNodeApplicationsQuery } from '../useNodeApplicationsQuery';

interface TableSettings extends BasicTableSettings, RefreshableTableSettings {}

export function NodeApplicationsDatatable({
  onRefresh,
  isLoading,
}: {
  onRefresh: () => void;
  isLoading: boolean;
}) {
  const tableState = useTableStateWithStorage<TableSettings>(
    'kube-node-apps',
    'Name',
    (set) => ({
      ...refreshableSettings(set),
    })
  );
  useRepeater(tableState.autoRefreshRate, onRefresh);

  const envId = useEnvironmentId();
  const {
    params: { nodeName: nodeName },
  } = useCurrentStateAndParams();

  const applicationsQuery = useAllNodeApplicationsQuery(envId, nodeName);
  const applications = Object.values(applicationsQuery.data ?? []);

  const columns = useColumns();

  return (
    <Datatable
      dataset={applications}
      settingsManager={tableState}
      columns={columns}
      disableSelect
      title="Applications running on this node"
      titleIcon={LaptopCode}
      isLoading={isLoading}
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
