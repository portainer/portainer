import { useMemo } from 'react';
import { FileCode } from 'lucide-react';
import { ConfigMap, Pod } from 'kubernetes-types/core/v1';
import { CronJob, Job } from 'kubernetes-types/batch/v1';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { Authorized, useAuthorizations } from '@/react/hooks/useUser';
import {
  DefaultDatatableSettings,
  TableSettings as KubeTableSettings,
} from '@/react/kubernetes/datatables/DefaultDatatableSettings';
import { useKubeStore } from '@/react/kubernetes/datatables/default-kube-datatable-store';
import { SystemResourceDescription } from '@/react/kubernetes/datatables/SystemResourceDescription';
import { pluralize } from '@/portainer/helpers/strings';
import { useNamespacesQuery } from '@/react/kubernetes/namespaces/queries/useNamespacesQuery';
import { Namespaces } from '@/react/kubernetes/namespaces/types';
import { CreateFromManifestButton } from '@/react/kubernetes/components/CreateFromManifestButton';
import { usePods } from '@/react/kubernetes/applications/usePods';
import { useJobs } from '@/react/kubernetes/applications/useJobs';
import { useCronJobs } from '@/react/kubernetes/applications/useCronJobs';

import { Datatable, TableSettingsMenu } from '@@/datatables';
import { AddButton } from '@@/buttons';
import { DeleteButton } from '@@/buttons/DeleteButton';
import {
  type FilteredColumnsTableSettings,
  filteredColumnsSettings,
} from '@@/datatables/types';
import { mergeOptions } from '@@/datatables/extend-options/mergeOptions';
import { withColumnFilters } from '@@/datatables/extend-options/withColumnFilters';

import {
  useConfigMapsForCluster,
  useMutationDeleteConfigMaps,
} from '../../configmap.service';
import { IndexOptional } from '../../types';

import { getIsConfigMapInUse } from './utils';
import { ConfigMapRowData } from './types';
import { columns } from './columns';

interface TableSettings
  extends KubeTableSettings,
    FilteredColumnsTableSettings {}

const storageKey = 'k8sConfigMapsDatatable';

export function ConfigMapsDatatable() {
  const tableState = useKubeStore<TableSettings>(
    storageKey,
    undefined,
    (set) => ({
      ...filteredColumnsSettings(set),
    })
  );
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
  const podsQuery = usePods(environmentId, namespaceNames);
  const jobsQuery = useJobs(environmentId, namespaceNames);
  const cronJobsQuery = useCronJobs(environmentId, namespaceNames);
  const isInUseLoading =
    podsQuery.isLoading || jobsQuery.isLoading || cronJobsQuery.isLoading;

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
    podsQuery.data ?? [],
    jobsQuery.data ?? [],
    cronJobsQuery.data ?? [],
    isInUseLoading,
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
      extendTableOptions={mergeOptions(
        withColumnFilters(tableState.columnFilters, tableState.setColumnFilters)
      )}
    />
  );
}

// useConfigMapRowData appends the `inUse` property to the ConfigMap data (for the unused badge in the name column)
// and wraps with useMemo to prevent unnecessary calculations
function useConfigMapRowData(
  configMaps: ConfigMap[],
  pods: Pod[],
  jobs: Job[],
  cronJobs: CronJob[],
  isInUseLoading: boolean,
  namespaces?: Namespaces
): ConfigMapRowData[] {
  return useMemo(
    () =>
      configMaps.map((configMap) => ({
        ...configMap,
        inUse:
          // if the apps are loading, set inUse to true to hide the 'unused' badge
          isInUseLoading ||
          getIsConfigMapInUse(configMap, pods, jobs, cronJobs),
        isSystem: namespaces
          ? namespaces?.[configMap.metadata?.namespace ?? '']?.IsSystem
          : false,
      })),
    [configMaps, isInUseLoading, pods, jobs, cronJobs, namespaces]
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
