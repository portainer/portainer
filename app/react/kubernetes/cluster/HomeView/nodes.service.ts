import { NodeList, Node } from 'kubernetes-types/core/v1';
import { useQuery } from '@tanstack/react-query';

import axios from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { withError } from '@/react-tools/react-query';

import { parseKubernetesAxiosError } from '../../axiosError';

const queryKeys = {
  node: (environmentId: number, nodeName: string) => [
    'environments',
    environmentId,
    'kubernetes',
    'nodes',
    nodeName,
  ],
  nodes: (environmentId: number) => [
    'environments',
    environmentId,
    'kubernetes',
    'nodes',
  ],
};

async function getNode(environmentId: EnvironmentId, nodeName: string) {
  try {
    const { data: node } = await axios.get<Node>(
      `/endpoints/${environmentId}/kubernetes/api/v1/nodes/${nodeName}`
    );
    return node;
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to get node details');
  }
}

export function useNodeQuery(environmentId: EnvironmentId, nodeName: string) {
  return useQuery(
    queryKeys.node(environmentId, nodeName),
    () => getNode(environmentId, nodeName),
    {
      ...withError('Unable to get node details'),
    }
  );
}

// getNodes is used to get a list of nodes using the kubernetes API
async function getNodes(environmentId: EnvironmentId) {
  try {
    const { data: nodeList } = await axios.get<NodeList>(
      `/endpoints/${environmentId}/kubernetes/api/v1/nodes`
    );
    return nodeList.items;
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to get nodes');
  }
}

// useNodesQuery is used to get an array of nodes using the kubernetes API
export function useNodesQuery(
  environmentId: EnvironmentId,
  options?: { autoRefreshRate?: number }
) {
  return useQuery(
    queryKeys.nodes(environmentId),
    async () => getNodes(environmentId),
    {
      ...withError(
        'Failed to get nodes from the Kubernetes api',
        'Failed to get nodes'
      ),
      refetchInterval() {
        return options?.autoRefreshRate ?? false;
      },
    }
  );
}
