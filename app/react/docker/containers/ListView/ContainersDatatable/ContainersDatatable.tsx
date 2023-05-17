import _ from 'lodash';
import { useStore } from 'zustand';
import { Box } from 'lucide-react';

import { Environment } from '@/react/portainer/environments/types';
import type { DockerContainer } from '@/react/docker/containers/types';
import { useShowGPUsColumn } from '@/react/docker/containers/utils';

import { TableSettingsMenu, Datatable } from '@@/datatables';
import {
  buildAction,
  QuickActionsSettings,
} from '@@/datatables/QuickActionsSettings';
import { ColumnVisibilityMenu } from '@@/datatables/ColumnVisibilityMenu';
import { useSearchBarState } from '@@/datatables/SearchBar';
import { TableSettingsProvider } from '@@/datatables/useTableSettings';

import { useContainers } from '../../queries/containers';

import { createStore } from './datatable-store';
import { ContainersDatatableSettings } from './ContainersDatatableSettings';
import { useColumns } from './columns';
import { ContainersDatatableActions } from './ContainersDatatableActions';
import { RowProvider } from './RowContext';

const storageKey = 'containers';
const settingsStore = createStore(storageKey);

const actions = [
  buildAction('logs', 'Logs'),
  buildAction('inspect', 'Inspect'),
  buildAction('stats', 'Stats'),
  buildAction('exec', 'Console'),
  buildAction('attach', 'Attach'),
];

export interface Props {
  isHostColumnVisible: boolean;
  environment: Environment;
}

export function ContainersDatatable({
  isHostColumnVisible,
  environment,
}: Props) {
  const settings = useStore(settingsStore);
  const isGPUsColumnVisible = useShowGPUsColumn(environment.Id);
  const columns = useColumns(isHostColumnVisible, isGPUsColumnVisible);
  const hidableColumns = _.compact(
    columns.filter((col) => col.canHide).map((col) => col.id)
  );

  const [search, setSearch] = useSearchBarState(storageKey);

  const containersQuery = useContainers(environment.Id, {
    autoRefreshRate: settings.autoRefreshRate * 1000,
  });

  return (
    <RowProvider context={{ environment }}>
      <TableSettingsProvider settings={settingsStore}>
        <Datatable
          titleIcon={Box}
          title="Containers"
          initialPageSize={settings.pageSize}
          onPageSizeChange={settings.setPageSize}
          initialSortBy={settings.sortBy}
          onSortByChange={settings.setSortBy}
          searchValue={search}
          onSearchChange={setSearch}
          columns={columns}
          renderTableActions={(selectedRows) => (
            <ContainersDatatableActions
              selectedItems={selectedRows}
              isAddActionVisible
              endpointId={environment.Id}
            />
          )}
          isLoading={containersQuery.isLoading}
          isRowSelectable={(row) => !row.original.IsPortainer}
          initialTableState={{ hiddenColumns: settings.hiddenColumns }}
          renderTableSettings={(tableInstance) => {
            const columnsToHide = tableInstance.allColumns.filter(
              (colInstance) => hidableColumns?.includes(colInstance.id)
            );

            return (
              <>
                <ColumnVisibilityMenu<DockerContainer>
                  columns={columnsToHide}
                  onChange={(hiddenColumns) => {
                    settings.setHiddenColumns(hiddenColumns);
                    tableInstance.setHiddenColumns(hiddenColumns);
                  }}
                  value={settings.hiddenColumns}
                />
                <TableSettingsMenu
                  quickActions={<QuickActionsSettings actions={actions} />}
                >
                  <ContainersDatatableSettings
                    isRefreshVisible
                    settings={settings}
                  />
                </TableSettingsMenu>
              </>
            );
          }}
          dataset={containersQuery.data || []}
          emptyContentLabel="No containers found"
        />
      </TableSettingsProvider>
    </RowProvider>
  );
}
