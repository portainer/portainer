import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';

import { buildUrl } from './build-url';

export interface SystemInfoResponse {
  platform: string;
  agents: number;
  edgeAgents: number;
  edgeDevices: number;
}

async function getSystemInfo() {
  try {
    const { data } = await axios.get<SystemInfoResponse>(buildUrl('system'));
    return data;
  } catch (error) {
    throw parseAxiosError(error as Error);
  }
}

export function useSystemInfo() {
  return useQuery(['status', 'system'], getSystemInfo, {
    ...withError('Unable to retrieve system info'),
  });
}
