import { Node } from 'kubernetes-types/core/v1';
import { useQuery } from '@tanstack/react-query';

import axios from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { withError } from '@/react-tools/react-query';

import { parseKubernetesAxiosError } from '../../axiosError';

import { queryKeys } from './query-keys';

async function getNode(
  environmentId: EnvironmentId,
  nodeName: string,
  isYaml?: boolean
) {
  try {
    const { data: node } = await axios.get<Node>(
      `/endpoints/${environmentId}/kubernetes/api/v1/nodes/${nodeName}`,
      {
        headers: {
          Accept: isYaml ? 'application/yaml' : undefined,
        },
        // axios-cache-interceptor keys responses by URL, not by Accept header,
        // so a unique param stops the YAML request reusing the cached JSON node
        params: isYaml ? { _: Date.now() } : undefined,
      }
    );
    return node;
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to get node details');
  }
}

export function useNodeQuery<T = Node>(
  environmentId: EnvironmentId,
  nodeName: string,
  queryOptions?: {
    select?: (data: Node) => T;
    enabled?: boolean;
    isYaml?: boolean;
  }
) {
  return useQuery(
    queryKeys.node(environmentId, nodeName, queryOptions?.isYaml),
    () => getNode(environmentId, nodeName, queryOptions?.isYaml),
    {
      ...withError('Unable to get node details'),
      ...queryOptions,
    }
  );
}
