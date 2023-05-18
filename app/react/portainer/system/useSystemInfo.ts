import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';

import { buildUrl } from './build-url';
import { queryKeys } from './query-keys';

export const queryKey = [...queryKeys.base(), 'info'] as const;

export type ContainerPlatform =
  | 'Docker Standalone'
  | 'Docker Swarm'
  | 'Kubernetes'
  | 'Podman'
  | 'Nomad';

export interface SystemInfoResponse {
  platform: ContainerPlatform;
  agents: number;
  edgeAgents: number;
}

async function getSystemInfo() {
  try {
    const { data } = await axios.get<SystemInfoResponse>(buildUrl('info'));
    return data;
  } catch (error) {
    throw parseAxiosError(error as Error);
  }
}

export function useSystemInfo() {
  return useQuery(queryKey, getSystemInfo, {
    ...withError('Unable to retrieve system info'),
  });
}
