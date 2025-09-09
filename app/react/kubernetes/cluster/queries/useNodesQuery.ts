import { NodeList, Node } from 'kubernetes-types/core/v1';
import { useQuery } from '@tanstack/react-query';

import axios from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { withGlobalError } from '@/react-tools/react-query';

import { parseKubernetesAxiosError } from '../../axiosError';

import { queryKeys } from './query-keys';

// getNodes is used to get a list of nodes using the kubernetes API
export async function getNodes(environmentId: EnvironmentId) {
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
export function useNodesQuery<T = Node[]>(
  environmentId: EnvironmentId,
  options?: { autoRefreshRate?: number; select?: (nodes: Node[]) => T }
) {
  return useQuery(
    queryKeys.nodes(environmentId),
    async () => getNodes(environmentId),
    {
      ...withGlobalError(
        'Failed to get nodes from the Kubernetes api',
        'Failed to get nodes'
      ),
      refetchInterval: options?.autoRefreshRate ?? false,
      select: options?.select,
    }
  );
}
