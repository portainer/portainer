import { useMutation, useQuery, useQueryClient } from 'react-query';
import { compact } from 'lodash';
import { ServiceList } from 'kubernetes-types/core/v1';

import { withError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { isFulfilled } from '@/portainer/helpers/promise-utils';
import {
  NodeMetrics,
  NodeMetric,
  Service,
} from '@/react/kubernetes/services/types';

export const queryKeys = {
  clusterServices: (environmentId: EnvironmentId) =>
    ['environments', environmentId, 'kubernetes', 'services'] as const,
};

export function useServicesForCluster(
  environmentId: EnvironmentId,
  namespaceNames?: string[],
  options?: { autoRefreshRate?: number }
) {
  return useQuery(
    queryKeys.clusterServices(environmentId),
    async () => {
      if (!namespaceNames?.length) {
        return [];
      }
      const settledServicesPromise = await Promise.allSettled(
        namespaceNames.map((namespace) =>
          getServices(environmentId, namespace, true)
        )
      );
      return compact(
        settledServicesPromise.filter(isFulfilled).flatMap((i) => i.value)
      );
    },
    {
      ...withError('Unable to get services.'),
      refetchInterval() {
        return options?.autoRefreshRate ?? false;
      },
      enabled: !!namespaceNames?.length,
    }
  );
}

export function useMutationDeleteServices(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();
  return useMutation(deleteServices, {
    onSuccess: () =>
      queryClient.invalidateQueries(queryKeys.clusterServices(environmentId)),
    ...withError('Unable to delete service(s)'),
  });
}

// get a list of services for a specific namespace from the Portainer API
async function getServices(
  environmentId: EnvironmentId,
  namespace: string,
  lookupApps: boolean
) {
  try {
    const { data: services } = await axios.get<Array<Service>>(
      `kubernetes/${environmentId}/namespaces/${namespace}/services`,
      {
        params: {
          lookupapplications: lookupApps,
        },
      }
    );
    return services;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve services');
  }
}

// getNamespaceServices is used to get a list of services for a specific namespace directly from the Kubernetes API
export async function getNamespaceServices(
  environmentId: EnvironmentId,
  namespace: string,
  queryParams?: Record<string, string>
) {
  const { data: services } = await axios.get<ServiceList>(
    `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/services`,
    {
      params: queryParams,
    }
  );
  return services.items;
}

export async function deleteServices({
  environmentId,
  data,
}: {
  environmentId: EnvironmentId;
  data: Record<string, string[]>;
}) {
  try {
    return await axios.post(
      `kubernetes/${environmentId}/services/delete`,
      data
    );
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to delete service(s)');
  }
}

export async function getMetricsForAllNodes(environmentId: EnvironmentId) {
  try {
    const { data: nodes } = await axios.get<NodeMetrics>(
      `kubernetes/${environmentId}/metrics/nodes`,
      {}
    );
    return nodes;
  } catch (e) {
    throw parseAxiosError(
      e as Error,
      'Unable to retrieve metrics for all nodes'
    );
  }
}

export async function getMetricsForNode(
  environmentId: EnvironmentId,
  nodeName: string
) {
  try {
    const { data: node } = await axios.get<NodeMetric>(
      `kubernetes/${environmentId}/metrics/nodes/${nodeName}`,
      {}
    );
    return node;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve metrics for node');
  }
}

export async function getMetricsForAllPods(
  environmentId: EnvironmentId,
  namespace: string
) {
  try {
    const { data: pods } = await axios.get(
      `kubernetes/${environmentId}/metrics/pods/namespace/${namespace}`,
      {}
    );
    return pods;
  } catch (e) {
    throw parseAxiosError(
      e as Error,
      'Unable to retrieve metrics for all pods'
    );
  }
}

export async function getMetricsForPod(
  environmentId: EnvironmentId,
  namespace: string,
  podName: string
) {
  try {
    const { data: pod } = await axios.get(
      `kubernetes/${environmentId}/metrics/pods/namespace/${namespace}/${podName}`,
      {}
    );
    return pod;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve metrics for pod');
  }
}
