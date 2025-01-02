import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import {
  NodeMetrics,
  NodeMetric,
  ApplicationResource,
} from '@/react/kubernetes/metrics/types';

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

export async function getTotalResourcesForAllApplications(
  environmentId: EnvironmentId,
  nodeName?: string
) {
  try {
    const { data: resources } = await axios.get<ApplicationResource>(
      `kubernetes/${environmentId}/metrics/applications_resources`,
      {
        params: {
          node: nodeName,
        },
      }
    );
    return resources;
  } catch (e) {
    throw parseAxiosError(
      e,
      'Unable to retrieve total resources for all applications'
    );
  }
}
