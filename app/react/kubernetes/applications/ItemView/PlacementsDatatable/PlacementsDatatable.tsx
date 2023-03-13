import { Minimize2 } from 'lucide-react';

import {
  BasicTableSettings,
  createPersistedStore,
  refreshableSettings,
  RefreshableTableSettings,
} from '@@/datatables/types';
import { ExpandableDatatable } from '@@/datatables/ExpandableDatatable';
import { useRepeater } from '@@/datatables/useRepeater';
import { TableSettingsMenu } from '@@/datatables';
import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';
import { useTableState } from '@@/datatables/useTableState';

import { Node } from '../types';

import { SubRow } from './PlacementsDatatableSubRow';
import { columns } from './columns';

interface TableSettings extends BasicTableSettings, RefreshableTableSettings {}

function createStore(storageKey: string) {
  return createPersistedStore<TableSettings>(storageKey, 'node', (set) => ({
    ...refreshableSettings(set),
  }));
}

const storageKey = 'kubernetes.application.placements';
const settingsStore = createStore(storageKey);

export function PlacementsDatatable({
  dataset,
  onRefresh,
}: {
  dataset: Node[];
  onRefresh: () => Promise<void>;
}) {
  const tableState = useTableState(settingsStore, storageKey);

  useRepeater(tableState.autoRefreshRate, onRefresh);

  return (
    <ExpandableDatatable
      getRowCanExpand={(row) => !row.original.AcceptsApplication}
      title="Placement constraints/preferences"
      titleIcon={Minimize2}
      dataset={dataset}
      settingsManager={tableState}
      columns={columns}
      disableSelect
      noWidget
      renderTableSettings={() => (
        <TableSettingsMenu>
          <TableSettingsMenuAutoRefresh
            value={tableState.autoRefreshRate}
            onChange={tableState.setAutoRefreshRate}
          />
        </TableSettingsMenu>
      )}
      emptyContentLabel="No node available."
      renderSubRow={(row) => (
        <SubRow node={row.original} cellCount={row.getVisibleCells().length} />
      )}
    />
  );
}
