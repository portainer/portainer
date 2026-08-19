import { Node } from 'kubernetes-types/core/v1';
import { useQuery } from '@tanstack/react-query';

import axios from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { withError } from '@/react-tools/react-query';

import { parseKubernetesAxiosError } from '../../axiosError';

import { queryKeys } from './query-keys';

// getNodes is used to get a list of nodes using the kubernetes API
export async function getNodes(environmentId: EnvironmentId) {
  try {
    const { data: nodes } = await axios.get<Node[]>(
      `/kubernetes/${environmentId}/nodes`
    );
    return nodes;
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
      ...withError(
        'Failed to get nodes from the Kubernetes api',
        'Failed to get nodes'
      ),
      refetchInterval: options?.autoRefreshRate ?? false,
      select: options?.select,
    }
  );
}
