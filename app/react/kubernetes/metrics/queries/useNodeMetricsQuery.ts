import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { NodeMetric } from '../types';

export function useNodeMetricsQuery<T = NodeMetric>(
  nodeName: string,
  environmentId: EnvironmentId,
  queryOptions?: UseQueryOptions<NodeMetric, unknown, T>
) {
  return useQuery({
    queryKey: [environmentId, 'node-metrics', nodeName],
    queryFn: () => getMetricsForNode(environmentId, nodeName),
    ...queryOptions,
  });
}

export async function getMetricsForNode(
  environmentId: EnvironmentId,
  nodeName: string
) {
  try {
    const { data: node } = await axios.get<NodeMetric>(
      `kubernetes/${environmentId}/metrics/nodes/${nodeName}`
    );

    return node;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve metrics for node');
  }
}
