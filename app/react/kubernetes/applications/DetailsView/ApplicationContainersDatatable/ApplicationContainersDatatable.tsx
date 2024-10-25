import { Server } from 'lucide-react';
import { useCurrentStateAndParams } from '@uirouter/react';
import { useMemo } from 'react';
import { ContainerStatus, Pod } from 'kubernetes-types/core/v1';

import { IndexOptional } from '@/react/kubernetes/configs/types';
import { createStore } from '@/react/kubernetes/datatables/default-kube-datatable-store';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useEnvironment } from '@/react/portainer/environments/queries';

import { Datatable } from '@@/datatables';
import { useTableState } from '@@/datatables/useTableState';

import { useApplication } from '../../queries/useApplication';
import { useApplicationPods } from '../../queries/useApplicationPods';

import { ContainerRowData } from './types';
import { getColumns } from './columns';

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

  // get the containers from the aapplication pods
  const applicationQuery = useApplication(
    environmentId,
    namespace,
    name,
    resourceType
  );
  const podsQuery = useApplicationPods(
    environmentId,
    namespace,
    name,
    applicationQuery.data
  );
  const appContainers = useContainersRowData(podsQuery.data);

  return (
    <Datatable<IndexOptional<ContainerRowData>>
      dataset={appContainers}
      columns={getColumns(!!useServerMetricsQuery.data)}
      settingsManager={tableState}
      isLoading={
        applicationQuery.isLoading ||
        podsQuery.isLoading ||
        useServerMetricsQuery.isLoading
      }
      title="Application containers"
      titleIcon={Server}
      getRowId={(row) => row.podName} // use pod name because it's unique (name is not unique)
      disableSelect
      data-cy="k8s-application-containers-datatable"
    />
  );
}

// useContainersRowData row data gets the pod.spec?.containers and pod.spec?.initContainers from an array of pods
// it then appends the podName, nodeName, podId, creationDate, and status to each container
function useContainersRowData(pods?: Pod[]): ContainerRowData[] {
  return (
    useMemo(
      () =>
        pods?.flatMap((pod) => {
          const containers = [
            ...(pod.spec?.containers || []),
            ...(pod.spec?.initContainers || []),
          ];
          return containers.map((container) => ({
            ...container,
            podName: pod.metadata?.name ?? '',
            nodeName: pod.spec?.nodeName ?? '',
            podIp: pod.status?.podIP ?? '',
            creationDate: pod.status?.startTime ?? '',
            status: computeContainerStatus(
              container.name,
              pod.status?.containerStatuses
            ),
          }));
        }) || [],
      [pods]
    ) || []
  );
}

function computeContainerStatus(
  containerName: string,
  statuses?: ContainerStatus[]
) {
  const status = statuses?.find((status) => status.name === containerName);
  if (!status) {
    return 'Terminated';
  }
  const { state } = status;
  if (state?.waiting) {
    return 'Waiting';
  }
  if (!state?.running) {
    return 'Terminated';
  }
  return 'Running';
}
