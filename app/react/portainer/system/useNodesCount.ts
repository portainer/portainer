import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';

import { buildUrl } from './build-url';
import { queryKeys } from './query-keys';

export const queryKey = [...queryKeys.base(), 'nodes'] as const;

export interface NodesCountResponse {
  nodes: number;
}

async function getNodesCount() {
  try {
    const { data } = await axios.get<NodesCountResponse>(buildUrl('nodes'));
    return data.nodes;
  } catch (error) {
    throw parseAxiosError(error as Error);
  }
}

export function useNodesCount() {
  return useQuery(queryKey, getNodesCount, {
    ...withError('Unable to retrieve nodes count'),
  });
}
