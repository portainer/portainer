import _ from 'lodash';
import { useQuery } from 'react-query';

import {Environment, EnvironmentId, NamespaceContainer} from '@/react/portainer/environments/types';
import type { DockerContainer } from '@/react/docker/containers/types';
import { useContainers } from '@/react/docker/containers/queries/containers';
import { getEndpoint } from '@/portainer/environments/environment.service';
import {withError} from "@/react-tools/react-query";

import { TableSettingsMenu, Datatable } from '@@/datatables';
import { buildAction, QuickActionsSettings } from '@@/datatables/QuickActionsSettings';
import { ColumnVisibilityMenu } from '@@/datatables/ColumnVisibilityMenu';

import { createStore } from "./datatable-store";
import { ContainersDatatableSettings } from "./ContainersDatatableSettings";
import { useColumns } from "./columns";
import { ContainersDatatableActions } from "./ContainersDatatableActions";


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

function useEnvironmentById(id?: EnvironmentId) {
  const result = useQuery(['environments', id], async () => (id ? getEndpoint(id) : null), {
                ...withError('Failed loading environment'),
                staleTime: 50,
                enabled: !!id,
              })
  return result.data as Environment;
}

export function ContainersDatatable({ isHostColumnVisible, namespace }: Props) {
  console.log('namespace = ', namespace)

  const settings = useStore();
  const columns = useColumns(isHostColumnVisible, false);
  const hidableColumns = _.compact(
    columns.filter((col) => col.canHide).map((col) => col.id)
  );
  
  const endpointIds = _.uniq(_.map(namespace.Containers, 'EndpointId'))
  console.log('endpointIds = ', endpointIds)
  
  const containers = _.map(namespace.Containers, item =>({Id: item.ContainerId}))
  

  let tableData = []

  // for (let i = 0; i < endpointIds.length; i++) {
  //   const id = endpointIds[i]
  // }

  const environment = useEnvironmentById(3)
  console.log('environment = ', environment)

  const containersQuery = useContainers(
    environment.Id,
    true,
    undefined,
    settings.autoRefreshRate * 1000
  );

  const response = _.map(containersQuery.data as DockerContainer[], item => (_.merge(item, {
      EnvironmentId: environment.Id,
      EnvironmentStatus: environment.Status,
      Host: environment.URL,
      PublicURL: environment.PublicURL,
    })
  ))
  
  tableData = _.merge(tableData, response) 

  console.log('containers = ', containers)  
  console.log('tableData = ', tableData)

  const queryData = _.intersectionBy(tableData, containers, 'Id')
  console.log('queryData = ', queryData)


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
            endpointId={environment.Id}
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
              <TableSettingsMenu quickActions={<QuickActionsSettings actions={actions} />} >
                <ContainersDatatableSettings
                  isRefreshVisible
                  settings={settings}
                />
              </TableSettingsMenu>
            </>
          );
        }}
        storageKey={storageKey}
        dataset={queryData || []}
        emptyContentLabel="No containers found"
      />
  );
}
