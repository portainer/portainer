import { Database } from 'lucide-react';

import { Datatable, TableSettingsMenu } from '@@/datatables';
import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';
import {
  BasicTableSettings,
  FilteredColumnsTableSettings,
  filteredColumnsSettings,
  RefreshableTableSettings,
  createPersistedStore,
  refreshableSettings,
} from '@@/datatables/types';
import { useRepeater } from '@@/datatables/useRepeater';
import { useTableState } from '@@/datatables/useTableState';
import { withMeta } from '@@/datatables/extend-options/withMeta';
import { withColumnFilters } from '@@/datatables/extend-options/withColumnFilters';
import { mergeOptions } from '@@/datatables/extend-options/mergeOptions';

import { DecoratedVolume } from '../types';

import { TableActions } from './TableActions';
import { useColumns } from './columns';

interface TableSettings
  extends BasicTableSettings,
    RefreshableTableSettings,
    FilteredColumnsTableSettings {}

const storageKey = 'docker-volumes';
const store = createPersistedStore<TableSettings>(
  storageKey,
  undefined,
  (set) => ({
    ...refreshableSettings(set),
    ...filteredColumnsSettings(set),
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
      extendTableOptions={mergeOptions(
        withMeta({
          table: 'volumes',
          isBrowseVisible,
        }),
        withColumnFilters(tableState.columnFilters, tableState.setColumnFilters)
      )}
      data-cy="docker-volumes-datatable"
    />
  );
}
