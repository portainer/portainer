import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
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
