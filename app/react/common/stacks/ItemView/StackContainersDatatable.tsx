import { Box } from 'lucide-react';

import { ContainerListViewModel } from '@/react/docker/containers/types';
import { Environment } from '@/react/portainer/environments/types';
import { createStore } from '@/react/docker/containers/ListView/ContainersDatatable/datatable-store';
import { useColumns } from '@/react/docker/containers/ListView/ContainersDatatable/columns';
import { ContainersDatatableActions } from '@/react/docker/containers/ListView/ContainersDatatable/ContainersDatatableActions';
import { ContainersDatatableSettings } from '@/react/docker/containers/ListView/ContainersDatatable/ContainersDatatableSettings';
import { useShowGPUsColumn } from '@/react/docker/containers/utils';

import { Datatable, Table } from '@@/datatables';
import {
  buildAction,
  QuickActionsSettings,
} from '@@/datatables/QuickActionsSettings';
import {
  ColumnVisibilityMenu,
  getColumnVisibilityState,
} from '@@/datatables/ColumnVisibilityMenu';
import { TableSettingsProvider } from '@@/datatables/useTableSettings';
import { useTableState } from '@@/datatables/useTableState';

import { useContainers } from '../../../docker/containers/queries/useContainers';
import { RowProvider } from '../../../docker/containers/ListView/ContainersDatatable/RowContext';

const storageKey = 'stack-containers';
const settingsStore = createStore(storageKey);

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
  const tableState = useTableState(settingsStore, storageKey);

  const isGPUsColumnVisible = useShowGPUsColumn(environment.Id);
  const columns = useColumns(false, isGPUsColumnVisible);

  const containersQuery = useContainers(environment.Id, {
    filters: {
      label: [`com.docker.compose.project=${stackName}`],
    },
    autoRefreshRate: tableState.autoRefreshRate * 1000,
  });

  return (
    <RowProvider context={{ environment }}>
      <TableSettingsProvider settings={settingsStore}>
        <Datatable
          title="Containers"
          titleIcon={Box}
          settingsManager={tableState}
          columns={columns}
          renderTableActions={(selectedRows) => (
            <ContainersDatatableActions
              selectedItems={selectedRows}
              isAddActionVisible={false}
              endpointId={environment.Id}
            />
          )}
          initialTableState={getColumnVisibilityState(tableState.hiddenColumns)}
          data-cy="stack-containers-datatable"
          renderTableSettings={(tableInstance) => (
            <>
              <ColumnVisibilityMenu<ContainerListViewModel>
                table={tableInstance}
                onChange={(hiddenColumns) => {
                  tableState.setHiddenColumns(hiddenColumns);
                }}
                value={tableState.hiddenColumns}
              />
              <Table.SettingsMenu
                quickActions={<QuickActionsSettings actions={actions} />}
              >
                <ContainersDatatableSettings settings={tableState} />
              </Table.SettingsMenu>
            </>
          )}
          dataset={containersQuery.data || []}
          isLoading={!containersQuery.data}
        />
      </TableSettingsProvider>
    </RowProvider>
  );
}
