import { values } from 'lodash';

import { ContainerStats } from '@/react/docker/containers/queries/useContainerStats';
import { ValueOf } from '@/types';

/**
 * This type is arbitrary and only defined based on what we use / observed from the API responses.
 */
export class ContainerStatsViewModel {
  read: string;

  preread: string;

  MemoryUsage: number;

  MemoryCache: number = 0;

  NumProcs: number = 0;

  isWindows: boolean = false;

  PreviousCPUTotalUsage: number;

  PreviousCPUSystemUsage: number;

  CurrentCPUTotalUsage: number;

  CurrentCPUSystemUsage: number;

  CPUCores: number;

  Networks: ValueOf<NonNullable<ContainerStats['networks']>>[];

  BytesRead: number = 0;

  BytesWrite: number = 0;

  noIOdata: boolean = false;

  constructor(data: ContainerStats) {
    this.read = data.read || '';
    this.preread = data.preread || '';
    if (data?.memory_stats?.privateworkingset !== undefined) {
      // Windows
      this.MemoryUsage = data?.memory_stats?.privateworkingset;
      this.MemoryCache = 0;
      this.NumProcs = data.num_procs || 0;
      this.isWindows = true;
    }
    // Podman has memory limit and usage but not stats
    else if (
      data?.memory_stats?.usage !== undefined &&
      data?.memory_stats?.stats === undefined
    ) {
      this.MemoryUsage = data.memory_stats.usage || 0;
      this.MemoryCache = 0;
    }
    // Linux
    else if (
      data?.memory_stats?.stats === undefined ||
      data?.memory_stats?.usage === undefined
    ) {
      this.MemoryUsage = 0;
      this.MemoryCache = 0;
    } else {
      this.MemoryCache = 0;
      if (data?.memory_stats?.stats?.cache !== undefined) {
        // cgroups v1
        this.MemoryCache = data.memory_stats.stats.cache;
      }
      this.MemoryUsage = data.memory_stats.usage - this.MemoryCache;
    }
    this.PreviousCPUTotalUsage =
      data?.precpu_stats?.cpu_usage?.total_usage || 0;
    this.PreviousCPUSystemUsage = data?.precpu_stats?.system_cpu_usage || 0;
    this.CurrentCPUTotalUsage = data?.cpu_stats?.cpu_usage?.total_usage || 0;
    this.CurrentCPUSystemUsage = data?.cpu_stats?.system_cpu_usage || 0;
    this.CPUCores = 1;

    this.CPUCores =
      data?.cpu_stats?.cpu_usage?.percpu_usage?.length ??
      data?.cpu_stats?.online_cpus ??
      1;

    this.Networks = values(data.networks);

    if (
      data.blkio_stats !== undefined &&
      data.blkio_stats.io_service_bytes_recursive !== null
    ) {
      // TODO: take care of multiple block devices
      let readData = data?.blkio_stats?.io_service_bytes_recursive?.find(
        (d) => d.op === 'Read'
      );
      if (readData === undefined) {
        // try the cgroups v2 version
        readData = data?.blkio_stats?.io_service_bytes_recursive?.find(
          (d) => d.op === 'read'
        );
      }
      if (readData !== undefined) {
        this.BytesRead = readData.value;
      }
      let writeData = data?.blkio_stats?.io_service_bytes_recursive?.find(
        (d) => d.op === 'Write'
      );
      if (writeData === undefined) {
        // try the cgroups v2 version
        writeData = data?.blkio_stats?.io_service_bytes_recursive?.find(
          (d) => d.op === 'write'
        );
      }
      if (writeData !== undefined) {
        this.BytesWrite = writeData.value;
      }
    } else {
      // no IO related data is available
      this.noIOdata = true;
    }
  }
}
