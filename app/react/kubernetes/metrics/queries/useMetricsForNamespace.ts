import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { PodMetrics } from '../types';

import { queryKeys } from './query-keys';

export function useMetricsForNamespace<T = PodMetrics>(
  environmentId: EnvironmentId,
  namespaceName: string,
  queryOptions?: UseQueryOptions<PodMetrics, unknown, T>
) {
  return useQuery({
    queryKey: queryKeys.namespaceMetrics(environmentId, namespaceName),
    queryFn: () => getMetricsForNamespace(environmentId, namespaceName),
    ...queryOptions,
  });
}

export async function getMetricsForNamespace(
  environmentId: EnvironmentId,
  namespaceName: string
) {
  try {
    const { data: pods } = await axios.get<PodMetrics>(
      `kubernetes/${environmentId}/metrics/pods/namespace/${namespaceName}`
    );
    return pods;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve metrics for all pods');
  }
}
