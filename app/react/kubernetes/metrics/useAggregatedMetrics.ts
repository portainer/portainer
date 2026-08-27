import { useState } from 'react';

import { ChartPoint, toChartPoint } from './chartPoint';

const CHART_LIMIT = 600;

type MetricsState = 'checking' | 'available' | 'unavailable';

export function useAggregatedMetrics(
  {
    data,
    error,
  }: {
    data: { cpu: string; memory: string; timestamp: string } | undefined;
    error: unknown;
  },
  nodeCPU: number
) {
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [metricsState, setMetricsState] = useState<MetricsState>('checking');
  const [lastNodeCPU, setLastNodeCPU] = useState(nodeCPU);
  const [lastData, setLastData] = useState<typeof data>(undefined);

  if (nodeCPU !== lastNodeCPU) {
    setLastNodeCPU(nodeCPU);
    setChartData([]);
  }

  if (metricsState === 'checking' && error !== undefined) {
    setMetricsState(error ? 'unavailable' : 'available');
  }

  if (data !== lastData) {
    setLastData(data);

    if (data) {
      setChartData((prev) => {
        const point = toChartPoint(
          data.cpu,
          data.memory,
          data.timestamp,
          nodeCPU
        );
        const next = [...prev, point];
        return next.length > CHART_LIMIT ? next.slice(1) : next;
      });
    }
  }

  return { chartData, metricsState, error: error ?? null };
}
