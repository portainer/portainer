import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';

import { buildUrl } from './build-url';

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
  return useQuery(['status', 'nodes'], getNodesCount, {
    ...withError('Unable to retrieve nodes count'),
  });
}
