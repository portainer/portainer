import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';

import { buildUrl } from './build-url';
import { queryKeys } from './query-keys';

export const queryKey = [...queryKeys.base(), 'metrics'] as const;

export interface SystemMetricsResponse {
  cpu: number;
  cpuCores: number;
  ram: number;
  ramUsed: number;
  ramTotal: number;
  disk: number;
  diskUsed: number;
  diskTotal: number;
  diskRead: number;
  diskWrite: number;
}

async function getSystemMetrics() {
  try {
    const { data } = await axios.get<SystemMetricsResponse>(
      buildUrl('metrics')
    );
    return data;
  } catch (error) {
    throw parseAxiosError(error as Error);
  }
}

export function useSystemMetrics() {
  return useQuery(queryKey, getSystemMetrics, {
    refetchInterval: 5000,
    retry: false,
  });
}
