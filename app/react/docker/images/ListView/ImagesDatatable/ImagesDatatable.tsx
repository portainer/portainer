import { List } from 'lucide-react';
import { useMemo } from 'react';

import { Authorized } from '@/react/hooks/useUser';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { Datatable, TableSettingsMenu } from '@@/datatables';
import {
  BasicTableSettings,
  createPersistedStore,
  FilteredColumnsTableSettings,
  filteredColumnsSettings,
  refreshableSettings,
  RefreshableTableSettings,
} from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';
import { AddButton } from '@@/buttons';
import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';
import { mergeOptions } from '@@/datatables/extend-options/mergeOptions';
import { withColumnFilters } from '@@/datatables/extend-options/withColumnFilters';

import { useImages } from '../../queries/useImages';

import { columns as defColumns } from './columns';
import { host as hostColumn } from './columns/host';
import { RemoveButtonMenu } from './RemoveButtonMenu';
import { ImportExportButtons } from './ImportExportButtons';

const tableKey = 'images';

export interface TableSettings
  extends BasicTableSettings,
    RefreshableTableSettings,
    FilteredColumnsTableSettings {}

const settingsStore = createPersistedStore<TableSettings>(
  tableKey,
  'tags',
  (set) => ({
    ...refreshableSettings(set),
    ...filteredColumnsSettings(set),
  })
);

export function ImagesDatatable({
  isHostColumnVisible,
}: {
  isHostColumnVisible: boolean;
}) {
  const environmentId = useEnvironmentId();
  const tableState = useTableState(settingsStore, tableKey);
  const columns = useMemo(
    () => (isHostColumnVisible ? [...defColumns, hostColumn] : defColumns),
    [isHostColumnVisible]
  );
  const imagesQuery = useImages(environmentId, true, {
    refetchInterval: tableState.autoRefreshRate * 1000,
  });

  return (
    <Datatable
      title="Images"
      titleIcon={List}
      data-cy="docker-images-datatable"
      extendTableOptions={mergeOptions(
        withColumnFilters(tableState.columnFilters, tableState.setColumnFilters)
      )}
      renderTableActions={(selectedItems) => (
        <div className="flex items-center gap-2">
          <RemoveButtonMenu selectedItems={selectedItems} />

          <ImportExportButtons selectedItems={selectedItems} />

          <Authorized authorizations="DockerImageBuild">
            <AddButton
              to="docker.images.build"
              data-cy="image-buildImageButton"
            >
              Build a new image
            </AddButton>
          </Authorized>
        </div>
      )}
      dataset={imagesQuery.data || []}
      isLoading={imagesQuery.isLoading}
      settingsManager={tableState}
      columns={columns}
      renderTableSettings={() => (
        <TableSettingsMenu>
          <TableSettingsMenuAutoRefresh
            value={tableState.autoRefreshRate}
            onChange={(value) => tableState.setAutoRefreshRate(value)}
          />
        </TableSettingsMenu>
      )}
    />
  );
}
