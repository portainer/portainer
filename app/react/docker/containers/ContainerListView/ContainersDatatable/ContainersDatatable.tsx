import _ from 'lodash';
import { useQuery } from 'react-query';

import {Environment, EnvironmentId, NamespaceContainer} from '@/portainer/environments/types';
import type { DockerContainer } from '@/react/docker/containers/types';
// import { useShowGPUsColumn } from '@/react/docker/containers/utils';
// import { useEnvironment } from '@/portainer/environments/queries/useEnvironment';
import { useContainers } from '@/react/docker/containers/queries/containers';
import { getEndpoint } from '@/portainer/environments/environment.service';
import {withError} from "@/react-tools/react-query";

import { TableSettingsMenu, Datatable } from '@@/datatables';
import { buildAction, QuickActionsSettings } from '@@/datatables/QuickActionsSettings';
import { ColumnVisibilityMenu } from '@@/datatables/ColumnVisibilityMenu';

import { createStore } from '../../ListView/ContainersDatatable/datatable-store';
import { ContainersDatatableSettings } from '../../ListView/ContainersDatatable/ContainersDatatableSettings';
import { useColumns } from '../../ListView/ContainersDatatable/columns';
import { ContainersDatatableActions } from '../../ListView/ContainersDatatable/ContainersDatatableActions';
// import { RowProvider } from '../../ListView/ContainersDatatable/RowContext';

const storageKey = 'namespacesContainers';
const useStore = createStore(storageKey);

const actions = [
  buildAction('logs', 'Logs'),
  buildAction('inspect', 'Inspect'),
  buildAction('stats', 'Stats'),
  buildAction('exec', 'Console'),
  buildAction('attach', 'Attach'),
  buildAction('explorer', 'Explorer'),
];

export interface Props {
  isHostColumnVisible: boolean;
  namespace: NamespaceContainer;
}

export function useEnvironmentById(id?: number) {
    return useQuery(['environments', id], () => (id ? getEndpoint(id) : null), {
        ...withError('Failed loading environment'),
        staleTime: 50,
        enabled: !!id,
    });
}

export function ContainersDatatable({ isHostColumnVisible, namespace }: Props) {
  console.log('namespace = ', namespace)

  const settings = useStore();
  const columns = useColumns(isHostColumnVisible, false);
  const hidableColumns = _.compact(
    columns.filter((col) => col.canHide).map((col) => col.id)
  );

  const endpointIds = Object.values(Object.values(namespace.Containers).map(v => v.EndpointId)
                                       .filter((x, index, self) => self.indexOf(x) === index))
  
  console.log('endpointIds = ', endpointIds)
  
  const environment = useEnvironmentById(3);
  console.log('environments = ', environment)

  // eval('debugger')
    // eslint-disable-next-line react-hooks/rules-of-hooks
  // const containersQuery = environment.data ? useContainers(environment.data, true, undefined, settings.autoRefreshRate * 1000) : null
  const containersQuery = useContainers(environment.data, true, undefined, settings.autoRefreshRate * 1000)

  // const containersQuery = any

  // console.log('containersQuery = ', containersQuery)

  // const environments = endpointIds.map((id) => {
  //   const res = useEnvironmentById(id)
  //   return res.data
  // })
  // console.log('environments = ', environment)

  // const containersQuery = environments.map(item => {
  //   console.log('environment = ', item)
  //   return useContainers(item, true, undefined, settings.autoRefreshRate * 1000)
  // })

 

  // const containersQuery = {data: []}

  return (
      <Datatable
        titleOptions={{
          icon: 'svg-cubes',
          title: 'Containers',
        }}
        settingsStore={settings}
        columns={columns}
        renderTableActions={(selectedRows) => (
          <ContainersDatatableActions
            selectedItems={selectedRows}
            isAddActionVisible
            endpointId={1}
          />
        )}
        isLoading={containersQuery.isLoading}
        isRowSelectable={(row) => !row.original.IsPortainer}
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
                <ContainersDatatableSettings
                  isRefreshVisible
                  settings={settings}
                />
              </TableSettingsMenu>
            </>
          );
        }}
        storageKey={storageKey}
        dataset={containersQuery.data || []}
        emptyContentLabel="No containers found"
      />
  );
}
