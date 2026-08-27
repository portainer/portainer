import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { NodeMetric } from '../types';

export function useNodeMetricsQuery<T = NodeMetric>(
  nodeName: string,
  environmentId: EnvironmentId,
  {
    select,
    refreshRateMS,
    retry,
  }: {
    select?: (data: NodeMetric) => T;
    refreshRateMS?: number;
    retry?: boolean;
  } = {}
) {
  return useQuery({
    queryKey: [environmentId, 'node-metrics', nodeName],
    queryFn: () => getMetricsForNode(environmentId, nodeName),
    select,
    ...(retry !== undefined && { retry }),
    refetchInterval: refreshRateMS
      ? (_data, query) => (query.state.error ? false : refreshRateMS)
      : undefined,
    refetchOnWindowFocus: refreshRateMS ? false : undefined,
    refetchOnReconnect: refreshRateMS ? false : undefined,
    refetchIntervalInBackground: !!refreshRateMS,
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
