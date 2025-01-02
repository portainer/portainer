import { Trello } from 'lucide-react';

import { NodeViewModel } from '@/docker/models/node';

import { Datatable, TableSettingsMenu } from '@@/datatables';
import {
  BasicTableSettings,
  RefreshableTableSettings,
  createPersistedStore,
  refreshableSettings,
} from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';
import { useRepeater } from '@@/datatables/useRepeater';
import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';
import { withMeta } from '@@/datatables/extend-options/withMeta';
import { mergeOptions } from '@@/datatables/extend-options/mergeOptions';

import { useColumns } from './columns';

const tableKey = 'nodes';

interface TableSettings extends BasicTableSettings, RefreshableTableSettings {}

const store = createPersistedStore<TableSettings>(
  tableKey,
  undefined,
  (set) => ({
    ...refreshableSettings(set),
  })
);

export function NodesDatatable({
  dataset,
  isIpColumnVisible,
  haveAccessToNode,
  onRefresh,
}: {
  dataset?: Array<NodeViewModel>;
  isIpColumnVisible: boolean;
  haveAccessToNode: boolean;
  onRefresh(): Promise<void>;
}) {
  const columns = useColumns(isIpColumnVisible);
  const tableState = useTableState(store, tableKey);
  useRepeater(tableState.autoRefreshRate, onRefresh);

  return (
    <Datatable<NodeViewModel>
      disableSelect
      title="Nodes"
      titleIcon={Trello}
      columns={columns}
      dataset={dataset || []}
      isLoading={!dataset}
      settingsManager={tableState}
      extendTableOptions={mergeOptions(
        withMeta({
          table: 'nodes',
          haveAccessToNode,
        })
      )}
      renderTableSettings={() => (
        <TableSettingsMenu>
          <TableSettingsMenuAutoRefresh
            value={tableState.autoRefreshRate}
            onChange={(value) => tableState.setAutoRefreshRate(value)}
          />
        </TableSettingsMenu>
      )}
      data-cy="swarm-nodes-datatable"
    />
  );
}
