import _ from 'lodash';

import { DockerContainer } from '@/react/docker/containers/types';
import { Environment } from '@/react/portainer/environments/types';
import { createStore } from '@/react/docker/containers/ListView/ContainersDatatable/datatable-store';
import { useColumns } from '@/react/docker/containers/ListView/ContainersDatatable/columns';
import { ContainersDatatableActions } from '@/react/docker/containers/ListView/ContainersDatatable/ContainersDatatableActions';
import { ContainersDatatableSettings } from '@/react/docker/containers/ListView/ContainersDatatable/ContainersDatatableSettings';
import { useShowGPUsColumn } from '@/react/docker/containers/utils';

import { Datatable, TableSettingsMenu } from '@@/datatables';
import {
  buildAction,
  QuickActionsSettings,
} from '@@/datatables/QuickActionsSettings';
import { ColumnVisibilityMenu } from '@@/datatables/ColumnVisibilityMenu';

import { useContainers } from '../../containers/queries/containers';
import { RowProvider } from '../../containers/ListView/ContainersDatatable/RowContext';

const storageKey = 'stack-containers';
const useStore = createStore(storageKey);

const actions = [
  buildAction('logs', 'Logs'),
  buildAction('inspect', 'Inspect'),
  buildAction('stats', 'Stats'),
  buildAction('exec', 'Console'),
  buildAction('attach', 'Attach'),
];

export interface Props {
  environment: Environment;
  stackName: string;
}

export function StackContainersDatatable({ environment, stackName }: Props) {
  const settings = useStore();
  const isGPUsColumnVisible = useShowGPUsColumn(environment.Id);
  const columns = useColumns(false, isGPUsColumnVisible);
  const hidableColumns = _.compact(
    columns.filter((col) => col.canHide).map((col) => col.id)
  );

  const containersQuery = useContainers(
    environment.Id,
    true,
    {
      label: [`com.docker.compose.project=${stackName}`],
    },
    settings.autoRefreshRate * 1000
  );

  return (
    <RowProvider context={{ environment }}>
      <Datatable
        titleOptions={{
          icon: 'fa-cubes',
          title: 'Containers',
        }}
        settingsStore={settings}
        columns={columns}
        renderTableActions={(selectedRows) => (
          <ContainersDatatableActions
            selectedItems={selectedRows}
            isAddActionVisible={false}
            endpointId={environment.Id}
          />
        )}
        initialTableState={{ hiddenColumns: settings.hiddenColumns }}
        renderTableSettings={(tableInstance) => {
          const columnsToHide = tableInstance.allColumns.filter((colInstance) =>
            hidableColumns?.includes(colInstance.id)
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
                <ContainersDatatableSettings settings={settings} />
              </TableSettingsMenu>
            </>
          );
        }}
        storageKey={storageKey}
        dataset={containersQuery.data || []}
        isLoading={containersQuery.isLoading}
        emptyContentLabel="No containers found"
      />
    </RowProvider>
  );
}
