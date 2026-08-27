import { filesize } from 'filesize';
import moment from 'moment';

import { ContainerStatsViewModel } from '@/docker/models/containerStats';

export type ChartPoint = {
  time: string;
  cpu: number;
  memory: number;
  cache: number;
  rx: number;
  tx: number;
  ioRead: number;
  ioWrite: number;
};

export function formatBytes(value: number): string {
  return value > 5
    ? filesize(value, { base: 10, round: 1 })
    : `${value.toFixed(1)}B`;
}

export function formatPercent(value: number): string {
  if (value >= 1) return `${Math.round(value)}%`;
  if (value >= 0.1) return `${value.toFixed(1)}%`;
  return `${value.toFixed(2)}%`;
}

export function calculateCpuPercent(stats: ContainerStatsViewModel): number {
  if (stats.isWindows) {
    const readMs = new Date(stats.read).getTime();
    const prereadMs = new Date(stats.preread).getTime();
    const possIntervals = stats.NumProcs * (readMs - prereadMs);
    if (possIntervals > 0) {
      return (
        (stats.CurrentCPUTotalUsage - stats.PreviousCPUTotalUsage) /
        (possIntervals * 100)
      );
    }
    return 0;
  }
  const cpuDelta = stats.CurrentCPUTotalUsage - stats.PreviousCPUTotalUsage;
  const systemDelta =
    stats.CurrentCPUSystemUsage - stats.PreviousCPUSystemUsage;
  if (systemDelta > 0 && cpuDelta > 0) {
    return (cpuDelta / systemDelta) * stats.CPUCores * 100;
  }
  return 0;
}

export function toChartPoint(stats: ContainerStatsViewModel): ChartPoint {
  return {
    time: moment(stats.read).format('HH:mm:ss'),
    cpu: calculateCpuPercent(stats),
    memory: stats.MemoryUsage,
    cache: stats.MemoryCache,
    rx: stats.Networks[0]?.rx_bytes ?? 0,
    tx: stats.Networks[0]?.tx_bytes ?? 0,
    ioRead: stats.BytesRead,
    ioWrite: stats.BytesWrite,
  };
}
