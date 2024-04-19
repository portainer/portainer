import { Code } from 'lucide-react';

import { Datatable, TableSettingsMenu } from '@@/datatables';
import { useRepeater } from '@@/datatables/useRepeater';
import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';
import { useTableStateWithStorage } from '@@/datatables/useTableState';
import {
  BasicTableSettings,
  refreshableSettings,
  RefreshableTableSettings,
} from '@@/datatables/types';

import { NamespaceApp } from './types';
import { useColumns } from './columns';

interface TableSettings extends BasicTableSettings, RefreshableTableSettings {}

export function NamespaceAppsDatatable({
  dataset,
  onRefresh,
  isLoading,
}: {
  dataset: Array<NamespaceApp>;
  onRefresh: () => void;
  isLoading: boolean;
}) {
  const tableState = useTableStateWithStorage<TableSettings>(
    'kube-namespace-apps',
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
      title="Applications running in this namespace"
      titleIcon={Code}
      isLoading={isLoading}
      renderTableSettings={() => (
        <TableSettingsMenu>
          <TableSettingsMenuAutoRefresh
            value={tableState.autoRefreshRate}
            onChange={tableState.setAutoRefreshRate}
          />
        </TableSettingsMenu>
      )}
      data-cy="namespace-apps-datatable"
    />
  );
}
