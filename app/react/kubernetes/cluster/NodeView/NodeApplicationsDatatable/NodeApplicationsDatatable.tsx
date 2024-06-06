import LaptopCode from '@/assets/ico/laptop-code.svg?c';

import { Datatable, TableSettingsMenu } from '@@/datatables';
import { useRepeater } from '@@/datatables/useRepeater';
import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';
import { useTableStateWithStorage } from '@@/datatables/useTableState';
import {
  BasicTableSettings,
  refreshableSettings,
  RefreshableTableSettings,
} from '@@/datatables/types';

import { useColumns } from './columns';
import { NodeApplication } from './types';

interface TableSettings extends BasicTableSettings, RefreshableTableSettings {}

export function NodeApplicationsDatatable({
  dataset,
  onRefresh,
  isLoading,
}: {
  dataset: Array<NodeApplication>;
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

  const columns = useColumns();

  return (
    <Datatable
      dataset={dataset}
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
