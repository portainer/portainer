import { CellContext } from '@tanstack/react-table';

import type { ContainerListViewModel } from '@/react/docker/containers/types';
import { useContainerMetricById } from '@/react/docker/containers/queries/useContainerMetrics';

import { useRowContext } from '../RowContext';

import { columnHelper } from './helper';

export const cpuPercent = columnHelper.display({
  header: 'CPU %',
  id: 'cpu',
  cell: CpuCell,
  enableHiding: true,
});

function CpuCell({
  row: { original: container },
}: CellContext<ContainerListViewModel, unknown>) {
  const { environment, isMetricsEnabled } = useRowContext();
  const metricsQuery = useContainerMetricById(
    environment.Id,
    container.Id,
    { enabled: isMetricsEnabled }
  );

  if (!metricsQuery.data) {
    return null;
  }

  if (!metricsQuery.data.cpuAvailable) {
    return <>Not Available</>;
  }

  return <>{metricsQuery.data.cpuPercent.toFixed(2)}%</>;
}
