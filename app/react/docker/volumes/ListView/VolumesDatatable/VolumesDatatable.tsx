import { Database } from 'lucide-react';

import { Datatable, TableSettingsMenu } from '@@/datatables';
import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';
import {
  BasicTableSettings,
  RefreshableTableSettings,
  createPersistedStore,
  refreshableSettings,
} from '@@/datatables/types';
import { useRepeater } from '@@/datatables/useRepeater';
import { useTableState } from '@@/datatables/useTableState';
import { withMeta } from '@@/datatables/extend-options/withMeta';

import { DecoratedVolume } from '../types';

import { TableActions } from './TableActions';
import { useColumns } from './columns';

interface TableSettings extends BasicTableSettings, RefreshableTableSettings {}

const storageKey = 'docker-volumes';
const store = createPersistedStore<TableSettings>(
  storageKey,
  undefined,
  (set) => ({
    ...refreshableSettings(set),
  })
);

export function VolumesDatatable({
  dataset,
  onRemove,
  onRefresh,
  isBrowseVisible,
}: {
  dataset?: Array<DecoratedVolume>;
  onRemove(items: Array<DecoratedVolume>): void;
  onRefresh(): Promise<void>;
  isBrowseVisible: boolean;
}) {
  const tableState = useTableState(store, storageKey);
  useRepeater(tableState.autoRefreshRate, onRefresh);
  const columns = useColumns();

  return (
    <Datatable
      title="Volumes"
      titleIcon={Database}
      columns={columns}
      dataset={dataset || []}
      isLoading={!dataset}
      settingsManager={tableState}
      emptyContentLabel="No volume available."
      renderTableActions={(selectedItems) => (
        <TableActions selectedItems={selectedItems} onRemove={onRemove} />
      )}
      renderTableSettings={() => (
        <TableSettingsMenu>
          <TableSettingsMenuAutoRefresh
            value={tableState.autoRefreshRate}
            onChange={(value) => tableState.setAutoRefreshRate(value)}
          />
        </TableSettingsMenu>
      )}
      extendTableOptions={withMeta({
        table: 'volumes',
        isBrowseVisible,
      })}
      data-cy="docker-volumes-datatable"
    />
  );
}
