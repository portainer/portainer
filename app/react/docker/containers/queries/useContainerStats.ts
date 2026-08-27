import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios from '@/portainer/services/axios/axios';

import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';
import { withAgentTargetHeader } from '../../proxy/queries/utils';
import { ContainerId } from '../types';

import { queryKeys } from './query-keys';

export function useContainerStats(
  environmentId: EnvironmentId,
  id: ContainerId,
  { refreshRateMS, nodeName }: { refreshRateMS: number; nodeName?: string }
) {
  return useQuery({
    queryKey: queryKeys.stats(environmentId, id),
    queryFn: () => containerStats(environmentId, id, nodeName),
    refetchInterval: (_data, query) =>
      query.state.error ? false : refreshRateMS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchIntervalInBackground: true,
  });
}

/**
 * This type is arbitrary and only defined based on what we use / observed from the API responses.
 */
export type ContainerStats = {
  name?: string;
  id?: string;
  read?: string;
  preread?: string;
  pids_stats?: {
    current?: number;
    limit?: number;
  };
  memory_stats?: MemoryStats;
  num_procs?: number;
  precpu_stats?: CpuStats;
  cpu_stats?: CpuStats;
  networks?: Record<string, NetworkStats>;
  blkio_stats?: BlkioStats;
  storage_stats?: unknown;
};

/**
 * Raw docker API proxy
 * @param environmentId
 * @param id
 * @returns
 */
export async function containerStats(
  environmentId: EnvironmentId,
  id: ContainerId,
  nodeName?: string
) {
  const { data } = await axios.get<ContainerStats>(
    buildDockerProxyUrl(environmentId, 'containers', id, 'stats'),
    {
      params: { stream: false },
      headers: { ...withAgentTargetHeader(nodeName) },
    }
  );
  return data;
}

type BlkioStats = {
  io_service_bytes_recursive?: {
    major: number;
    minor: number;
    op: string;
    value: number;
  }[];
  io_serviced_recursive?: null;
  io_queue_recursive?: null;
  io_service_time_recursive?: null;
  io_wait_time_recursive?: null;
  io_merged_recursive?: null;
  io_time_recursive?: null;
  sectors_recursive?: null;
};

type NetworkStats = {
  rx_bytes?: number;
  rx_packets?: number;
  rx_errors?: number;
  rx_dropped?: number;
  tx_bytes?: number;
  tx_packets?: number;
  tx_errors?: number;
  tx_dropped?: number;
};

type MemoryStats = {
  privateworkingset?: number;
  usage?: number;
  stats?: MemoryStatsStats;
  limit?: number;
};

type MemoryStatsStats = {
  active_anon?: number;
  active_file?: number;
  anon?: number;
  anon_thp?: number;
  cache?: number;
  file?: number;
  file_dirty?: number;
  file_mapped?: number;
  file_writeback?: number;
  inactive_anon?: number;
  inactive_file?: number;
  kernel_stack?: number;
  pgactivate?: number;
  pgdeactivate?: number;
  pgfault?: number;
  pglazyfree?: number;
  pglazyfreed?: number;
  pgmajfault?: number;
  pgrefill?: number;
  pgscan?: number;
  pgsteal?: number;
  shmem?: number;
  slab?: number;
  slab_reclaimable?: number;
  slab_unreclaimable?: number;
  sock?: number;
  thp_collapse_alloc?: number;
  thp_fault_alloc?: number;
  unevictable?: number;
  workingset_activate?: number;
  workingset_nodereclaim?: number;
  workingset_refault?: number;
};

type CpuUsage = {
  total_usage?: number;
  usage_in_kernelmode?: number;
  usage_in_usermode?: number;
  percpu_usage?: number[];
};

type ThrottlingData = {
  periods?: number;
  throttled_periods?: number;
  throttled_time?: number;
};

type CpuStats = {
  cpu_usage?: CpuUsage;
  system_cpu_usage?: number;
  online_cpus?: number;
  throttling_data?: ThrottlingData;
};
