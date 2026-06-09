import { Server } from 'lucide-react';
import { useCurrentStateAndParams } from '@uirouter/react';
import { useMemo } from 'react';
import { Pod } from 'kubernetes-types/core/v1';

import { IndexOptional } from '@/react/kubernetes/configs/types';
import { createStore } from '@/react/kubernetes/datatables/default-kube-datatable-store';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useEnvironment } from '@/react/portainer/environments/queries';
import { useKubernetesVersion } from '@/react/kubernetes/queries/useKubernetesVersion';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';

import { TableSettingsMenu, TableSettingsMenuAutoRefresh } from '@@/datatables';
import { useTableState } from '@@/datatables/useTableState';
import { CardExpandableList } from '@@/datatables/CardExpandableList';
import { NestedDatatable } from '@@/datatables/NestedDatatable';

import { useApplication } from '../../queries/useApplication';
import { useApplicationPods } from '../../queries/useApplicationPods';
import { useDeletePodMutation } from '../../queries/useDeletePodMutation';

import { ContainerRowData, PodRowData } from './types';
import { getPodColumns } from './columns/pod';
import { getContainerColumns } from './columns/container';
import { computeContainerStatus } from './computeContainerStatus';
import { computePodStatus } from './computePodStatus';

const storageKey = 'k8sContainersDatatable';
const settingsStore = createStore(storageKey);

export function ApplicationContainersDatatable() {
  const environmentId = useEnvironmentId();
  const useServerMetricsQuery = useEnvironment(
    environmentId,
    (env) => !!env?.Kubernetes?.Configuration.UseServerMetrics
  );
  const tableState = useTableState(settingsStore, storageKey);
  const {
    params: { name, namespace, 'resource-type': resourceType },
  } = useCurrentStateAndParams();

  const applicationQuery = useApplication(
    environmentId,
    namespace,
    name,
    resourceType,
    {
      autoRefreshRate: tableState.autoRefreshRate * 1000,
    }
  );
  const podsQuery = useApplicationPods(
    environmentId,
    namespace,
    name,
    applicationQuery.data,
    {
      autoRefreshRate: tableState.autoRefreshRate * 1000,
    }
  );
  const versionQuery = useKubernetesVersion(environmentId);
  const deletePodMutation = useDeletePodMutation(
    environmentId,
    namespace,
    name
  );
  const podRows = useContainersRowData(podsQuery.data);
  const containerColumns = useMemo(
    () => getContainerColumns(!!useServerMetricsQuery.data),
    [useServerMetricsQuery.data]
  );
  const podColumns = useMemo(
    () =>
      getPodColumns({
        supportsRestartStrategy: !!versionQuery.data?.supportsPodRestart,
        isDeleting: deletePodMutation.isLoading,
        isLoading: versionQuery.isLoading,
        onDelete: (podName) => {
          deletePodMutation.mutate(
            { podName },
            {
              onSuccess: () =>
                notifySuccess('Success', `Pod '${podName}' deleted`),
              onError: (error) =>
                notifyError(
                  'Failure',
                  error as Error,
                  `Unable to delete pod '${podName}'`
                ),
            }
          );
        },
      }),
    [versionQuery, deletePodMutation]
  );

  return (
    <div className="row">
      <div className="col-sm-12">
        <CardExpandableList<IndexOptional<PodRowData>>
          dataset={podRows}
          columns={podColumns}
          settingsManager={tableState}
          isLoading={
            applicationQuery.isLoading ||
            podsQuery.isLoading ||
            useServerMetricsQuery.isLoading
          }
          title="Application pods"
          titleIcon={Server}
          getRowId={(row) => row.podName}
          disableSelect
          data-cy="k8s-application-containers-datatable"
          getRowCanExpand={(row) => row.original.containers.length > 0}
          renderSubRow={(row) => (
            <div className="-m-2 overflow-hidden rounded-sm bg-[color:var(--bg-card-color)] pl-6">
              <NestedDatatable<ContainerRowData>
                dataset={row.original.containers}
                columns={containerColumns}
                getRowId={(c) => `${row.original.podName}/${c.name}`}
                data-cy={`k8s-application-containers-${row.original.podName}-inner`}
                enablePagination={false}
              />
            </div>
          )}
          renderTableSettings={() => (
            <TableSettingsMenu>
              <TableSettingsMenuAutoRefresh
                value={tableState.autoRefreshRate}
                onChange={(value) => tableState.setAutoRefreshRate(value)}
              />
            </TableSettingsMenu>
          )}
          initialTableState={{
            pagination: { pageIndex: 0, pageSize: 5 },
            expanded: true,
          }}
        />
      </div>
    </div>
  );
}

// useContainersRowData groups containers (including init containers) under their
// owning pod, returning one row per pod for the top-level datatable.
function useContainersRowData(pods?: Pod[]): PodRowData[] {
  return useMemo(() => {
    if (!pods) {
      return [];
    }
    return pods.map((pod) => {
      const containers: ContainerRowData[] = [
        ...(pod.spec?.containers?.map((c) => ({
          ...c,
          isInit: false,
        })) ?? []),
        ...(pod.spec?.initContainers?.map((c) => ({
          ...c,
          isInit: true,
          // https://kubernetes.io/docs/concepts/workloads/pods/sidecar-containers/#sidecar-containers-and-pod-lifecycle
          isSidecar: c.restartPolicy === 'Always',
        })) ?? []),
      ].map((container) => ({
        ...container,
        podName: pod.metadata?.name ?? '',
        status: computeContainerStatus(
          container.name,
          pod.status?.containerStatuses,
          pod.status?.initContainerStatuses
        ),
      }));

      const statuses = pod.status?.containerStatuses ?? [];
      return {
        podName: pod.metadata?.name ?? '',
        nodeName: pod.spec?.nodeName ?? '',
        podIp: pod.status?.podIP ?? '',
        creationDate: pod.status?.startTime ?? '',
        status: computePodStatus(pod),
        containers,
        readyContainers: statuses.filter((s) => s.ready).length,
        totalContainers:
          statuses.length || containers.filter((c) => !c.isInit).length,
      };
    });
  }, [pods]);
}
