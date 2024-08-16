import { useMemo } from 'react';
import { FileCode } from 'lucide-react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { Authorized, useAuthorizations } from '@/react/hooks/useUser';
import { DefaultDatatableSettings } from '@/react/kubernetes/datatables/DefaultDatatableSettings';
import { createStore } from '@/react/kubernetes/datatables/default-kube-datatable-store';
import { SystemResourceDescription } from '@/react/kubernetes/datatables/SystemResourceDescription';
import { useIsDeploymentOptionHidden } from '@/react/hooks/useIsDeploymentOptionHidden';
import { pluralize } from '@/portainer/helpers/strings';
import { useNamespacesQuery } from '@/react/kubernetes/namespaces/queries/useNamespacesQuery';
import { Namespaces } from '@/react/kubernetes/namespaces/types';
import { CreateFromManifestButton } from '@/react/kubernetes/components/CreateFromManifestButton';
import { useJobs } from '@/react/kubernetes/applications/useJobs';
import { usePods } from '@/react/kubernetes/applications/usePods';
import { useCronJobs } from '@/react/kubernetes/applications/useCronJobs';

import { Datatable, TableSettingsMenu } from '@@/datatables';
import { AddButton } from '@@/buttons';
import { useTableState } from '@@/datatables/useTableState';
import { DeleteButton } from '@@/buttons/DeleteButton';

import { IndexOptional, Configuration } from '../../types';
import { CronJob, Job, K8sPod } from '../../../applications/types';
import { useDeleteConfigMaps } from '../../queries/useDeleteConfigMaps';
import { useConfigMapsForCluster } from '../../queries/useConfigmapsForCluster';

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
  const withSystem = canAccessSystemResources && tableState.showSystemResources;

  const namespacesQuery = useNamespacesQuery(environmentId, {
    autoRefreshRate: tableState.autoRefreshRate * 1000,
  });
  const configMapsQuery = useConfigMapsForCluster(environmentId, {
    withSystem,
    autoRefreshRate: tableState.autoRefreshRate * 1000,
  });
  const jobsQuery = useJobs(environmentId, {
    withSystem,
    autoRefreshRate: tableState.autoRefreshRate * 1000,
  });
  const cronJobsQuery = useCronJobs(environmentId, {
    withSystem,
    autoRefreshRate: tableState.autoRefreshRate * 1000,
  });
  const podsQuery = usePods(environmentId, {
    params: {
      withSystem,
    },
    queryOptions: {
      refetchInterval: tableState.autoRefreshRate * 1000,
    },
  });
  const isInUseLoading =
    jobsQuery.isLoading || cronJobsQuery.isLoading || podsQuery.isLoading;

  const configMapRowData = useConfigMapRowData(
    configMapsQuery.data ?? [],
    podsQuery.data ?? [],
    jobsQuery.data ?? [],
    cronJobsQuery.data ?? [],
    isInUseLoading,
    namespacesQuery.data
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
      getRowId={(row) => row.UID ?? ''}
      isRowSelectable={(row) =>
        !namespacesQuery.data?.[row.original.Namespace ?? '']?.IsSystem
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
  configMaps: Configuration[],
  pods: K8sPod[],
  jobs: Job[],
  cronJobs: CronJob[],
  isInUseLoading: boolean,
  namespaces?: Namespaces
): ConfigMapRowData[] {
  return useMemo(
    () =>
      configMaps?.map((configMap) => ({
        ...configMap,
        inUse:
          // if the apps are loading, set inUse to true to hide the 'unused' badge
          isInUseLoading ||
          getIsConfigMapInUse(configMap, pods, jobs, cronJobs),
        isSystem: namespaces
          ? namespaces?.[configMap.Namespace ?? '']?.IsSystem
          : false,
      })) || [],
    [configMaps, isInUseLoading, pods, jobs, cronJobs, namespaces]
  );
}

function TableActions({
  selectedItems,
}: {
  selectedItems: ConfigMapRowData[];
}) {
  const isAddConfigMapHidden = useIsDeploymentOptionHidden('form');
  const environmentId = useEnvironmentId();
  const deleteConfigMapMutation = useDeleteConfigMaps(environmentId);

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

      {!isAddConfigMapHidden && (
        <AddButton
          to="kubernetes.configmaps.new"
          data-cy="k8sConfig-addConfigWithFormButton"
          color="secondary"
        >
          Add with form
        </AddButton>
      )}

      <CreateFromManifestButton
        params={{
          tab: 'configmaps',
        }}
        data-cy="k8sConfig-deployFromManifestButton"
      />
    </Authorized>
  );

  async function handleRemoveClick(configMaps: ConfigMapRowData[]) {
    const configMapsToDelete = configMaps.map((configMap) => ({
      namespace: configMap.Namespace ?? '',
      name: configMap.Name ?? '',
    }));

    await deleteConfigMapMutation.mutateAsync(configMapsToDelete);
  }
}