import { useMemo } from 'react';
import { FileCode } from 'lucide-react';
import { ConfigMap } from 'kubernetes-types/core/v1';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { Authorized, useAuthorizations } from '@/react/hooks/useUser';
import { DefaultDatatableSettings } from '@/react/kubernetes/datatables/DefaultDatatableSettings';
import { createStore } from '@/react/kubernetes/datatables/default-kube-datatable-store';
import { SystemResourceDescription } from '@/react/kubernetes/datatables/SystemResourceDescription';
import { useApplicationsQuery } from '@/react/kubernetes/applications/application.queries';
import { Application } from '@/react/kubernetes/applications/types';
import { pluralize } from '@/portainer/helpers/strings';
import { useNamespacesQuery } from '@/react/kubernetes/namespaces/queries/useNamespacesQuery';
import { Namespaces } from '@/react/kubernetes/namespaces/types';
import { CreateFromManifestButton } from '@/react/kubernetes/components/CreateFromManifestButton';

import { Datatable, TableSettingsMenu } from '@@/datatables';
import { AddButton } from '@@/buttons';
import { useTableState } from '@@/datatables/useTableState';
import { DeleteButton } from '@@/buttons/DeleteButton';

import {
  useConfigMapsForCluster,
  useMutationDeleteConfigMaps,
} from '../../configmap.service';
import { IndexOptional } from '../../types';

import { getIsConfigMapInUse } from './utils';
import { ConfigMapRowData } from './types';
import { columns } from './columns';

const storageKey = 'k8sConfigMapsDatatable';
const settingsStore = createStore(storageKey);

export function ConfigMapsDatatable() {
  const tableState = useTableState(settingsStore, storageKey);
  const { authorized: canWrite } = useAuthorizations(['K8sConfigMapsW']);
  const readOnly = !canWrite;
  const { authorized: canAccessSystemResources } = useAuthorizations(
    'K8sAccessSystemNamespaces'
  );

  const environmentId = useEnvironmentId();
  const { data: namespaces, ...namespacesQuery } = useNamespacesQuery(
    environmentId,
    {
      autoRefreshRate: tableState.autoRefreshRate * 1000,
    }
  );
  const namespaceNames = Object.keys(namespaces || {});
  const { data: configMaps, ...configMapsQuery } = useConfigMapsForCluster(
    environmentId,
    namespaceNames,
    {
      autoRefreshRate: tableState.autoRefreshRate * 1000,
    }
  );
  const { data: applications, ...applicationsQuery } = useApplicationsQuery(
    environmentId,
    namespaceNames
  );

  const filteredConfigMaps = useMemo(
    () =>
      configMaps?.filter(
        (configMap) =>
          (canAccessSystemResources && tableState.showSystemResources) ||
          !namespaces?.[configMap.metadata?.namespace ?? '']?.IsSystem
      ) || [],
    [configMaps, tableState, canAccessSystemResources, namespaces]
  );
  const configMapRowData = useConfigMapRowData(
    filteredConfigMaps,
    applications ?? [],
    applicationsQuery.isLoading,
    namespaces
  );

  return (
    <Datatable<IndexOptional<ConfigMapRowData>>
      dataset={configMapRowData}
      columns={columns}
      settingsManager={tableState}
      isLoading={configMapsQuery.isLoading || namespacesQuery.isLoading}
      emptyContentLabel="No ConfigMaps found"
      title="ConfigMaps"
      titleIcon={FileCode}
      getRowId={(row) => row.metadata?.uid ?? ''}
      isRowSelectable={(row) =>
        !namespaces?.[row.original.metadata?.namespace ?? ''].IsSystem
      }
      disableSelect={readOnly}
      renderTableActions={(selectedRows) => (
        <TableActions selectedItems={selectedRows} />
      )}
      renderTableSettings={() => (
        <TableSettingsMenu>
          <DefaultDatatableSettings settings={tableState} />
        </TableSettingsMenu>
      )}
      description={
        <SystemResourceDescription
          showSystemResources={tableState.showSystemResources}
        />
      }
      data-cy="k8s-configmaps-datatable"
    />
  );
}

// useConfigMapRowData appends the `inUse` property to the ConfigMap data (for the unused badge in the name column)
// and wraps with useMemo to prevent unnecessary calculations
function useConfigMapRowData(
  configMaps: ConfigMap[],
  applications: Application[],
  applicationsLoading: boolean,
  namespaces?: Namespaces
): ConfigMapRowData[] {
  return useMemo(
    () =>
      configMaps.map((configMap) => ({
        ...configMap,
        inUse:
          // if the apps are loading, set inUse to true to hide the 'unused' badge
          applicationsLoading || getIsConfigMapInUse(configMap, applications),
        isSystem: namespaces
          ? namespaces?.[configMap.metadata?.namespace ?? '']?.IsSystem
          : false,
      })),
    [configMaps, applicationsLoading, applications, namespaces]
  );
}

function TableActions({
  selectedItems,
}: {
  selectedItems: ConfigMapRowData[];
}) {
  const environmentId = useEnvironmentId();
  const deleteConfigMapMutation = useMutationDeleteConfigMaps(environmentId);

  async function handleRemoveClick(configMaps: ConfigMap[]) {
    const configMapsToDelete = configMaps.map((configMap) => ({
      namespace: configMap.metadata?.namespace ?? '',
      name: configMap.metadata?.name ?? '',
    }));

    await deleteConfigMapMutation.mutateAsync(configMapsToDelete);
  }

  return (
    <Authorized authorizations="K8sConfigMapsW">
      <DeleteButton
        disabled={selectedItems.length === 0}
        onConfirmed={() => handleRemoveClick(selectedItems)}
        confirmMessage={`Are you sure you want to remove the selected ${pluralize(
          selectedItems.length,
          'ConfigMap'
        )}`}
        data-cy="k8sConfig-removeConfigButton"
      />

      <AddButton
        to="kubernetes.configmaps.new"
        data-cy="k8sConfig-addConfigWithFormButton"
        color="secondary"
      >
        Add with form
      </AddButton>

      <CreateFromManifestButton
        params={{
          tab: 'configmaps',
        }}
        data-cy="k8sConfig-deployFromManifestButton"
      />
    </Authorized>
  );
}
