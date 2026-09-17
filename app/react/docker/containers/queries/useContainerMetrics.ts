import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { withGlobalError } from '@/react-tools/react-query';

import { queryKeys as dockerQueryKeys } from '../../queries/utils';

export interface ContainerMetric {
  containerId: string;
  containerName: string;
  cpuPercent: number;
  cpuAvailable: boolean;
  memoryUsage: number;
  memoryLimit: number;
  memoryPercent: number;
  blockReadRate: number;
  blockWriteRate: number;
  blkioAvailable: boolean;
}

const METRICS_REFETCH_INTERVAL_MS = 30_000;

export const metricsQueryKeys = {
  containers: (environmentId: EnvironmentId) =>
    [...dockerQueryKeys.root(environmentId), 'metrics', 'containers'] as const,
};

async function getContainerMetrics(
  environmentId: EnvironmentId
): Promise<ContainerMetric[]> {
  try {
    const { data } = await axios.get<ContainerMetric[]>(
      `/endpoints/${environmentId}/metrics/containers/current`
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to retrieve container metrics');
  }
}

/**
 * Fetches current CPU, memory, and block I/O metrics for a single container.
 *
 * All cells that call this hook share the same React Query cache entry
 * (the query key does not include containerId), so only one network request
 * is issued per render cycle regardless of how many metric columns are visible.
 */
export function useContainerMetricById(
  environmentId: EnvironmentId,
  containerId: string,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery(
    metricsQueryKeys.containers(environmentId),
    () => getContainerMetrics(environmentId),
    {
      ...withGlobalError('Unable to retrieve container metrics'),
      refetchInterval: enabled ? METRICS_REFETCH_INTERVAL_MS : false,
      enabled,
      select: (data) => data.find((m) => m.containerId === containerId),
    }
  );
}
