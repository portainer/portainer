import { useQuery } from '@tanstack/react-query';

import axios from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { SinglePodMetric } from '../types';

export function usePodMetricsQuery<T = SinglePodMetric>(
  {
    environmentId,
    namespace,
    podName,
  }: {
    environmentId: EnvironmentId;
    namespace: string;
    podName: string;
  },
  {
    refreshRateMS,
    select,
  }: {
    select?: (data: SinglePodMetric) => T;
    refreshRateMS?: number;
  } = {}
) {
  return useQuery({
    queryFn: () => getMetricsForPod(environmentId, namespace, podName),
    queryKey: [environmentId, 'pod-metrics', namespace, podName],
    refetchInterval: refreshRateMS
      ? (_data, query) => (query.state.error ? false : refreshRateMS)
      : undefined,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchIntervalInBackground: true,
    select,
  });
}

async function getMetricsForPod(
  environmentId: EnvironmentId,
  namespace: string,
  podName: string
) {
  const { data: pod } = await axios.get<SinglePodMetric>(
    `kubernetes/${environmentId}/metrics/pods/namespace/${namespace}/${podName}`
  );
  return pod;
}
