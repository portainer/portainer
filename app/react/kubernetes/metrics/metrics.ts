import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { NodeMetrics } from './types';

export async function getMetricsForAllNodes(environmentId: EnvironmentId) {
  try {
    const { data: nodes } = await axios.get<NodeMetrics>(
      `kubernetes/${environmentId}/metrics/nodes`
    );
    return nodes;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve metrics for all nodes');
  }
}

export async function getMetricsForPod(
  environmentId: EnvironmentId,
  namespace: string,
  podName: string
) {
  try {
    const { data: pod } = await axios.get(
      `kubernetes/${environmentId}/metrics/pods/namespace/${namespace}/${podName}`
    );
    return pod;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve metrics for pod');
  }
}
