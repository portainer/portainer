import { useState } from 'react';

import { ContainerStatsViewModel } from '@/docker/models/containerStats';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { useContainerStats } from '../queries/useContainerStats';
import { ContainerId } from '../types';

import { ChartPoint, toChartPoint } from './chartPoint';

const CHART_LIMIT = 600;

export function useAggregatedStats(
  environmentId: EnvironmentId,
  containerId: ContainerId,
  nodeName: string | undefined,
  refreshRateMS: number
) {
  const statsQuery = useContainerStats(environmentId, containerId, {
    refreshRateMS,
    nodeName,
  });
  const rawStats = statsQuery.data;

  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [networkUnavailable, setNetworkUnavailable] = useState(false);
  const [ioUnavailable, setIoUnavailable] = useState(false);
  const [lastRawStats, setLastRawStats] = useState(rawStats);

  if (rawStats !== lastRawStats) {
    setLastRawStats(rawStats);

    if (rawStats) {
      const stats = new ContainerStatsViewModel(rawStats);

      setChartData((prev) => {
        const next = [...prev, toChartPoint(stats)];
        return next.length > CHART_LIMIT ? next.slice(1) : next;
      });

      // Only a sample fetched by this mount can mark network/IO unavailable
      if (statsQuery.isFetchedAfterMount) {
        if (stats.Networks.length === 0) {
          setNetworkUnavailable(true);
        }
        if (stats.noIOdata) {
          setIoUnavailable(true);
        }
      }
    }
  }

  return {
    chartData,
    networkUnavailable,
    ioUnavailable,
    error: statsQuery.error,
  };
}
