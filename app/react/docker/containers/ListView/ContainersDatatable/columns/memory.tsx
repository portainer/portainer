import { CellContext } from '@tanstack/react-table';

import type { ContainerListViewModel } from '@/react/docker/containers/types';
import { useContainerMetricById } from '@/react/docker/containers/queries/useContainerMetrics';
import { humanize } from '@/portainer/filters/filters';

import { useRowContext } from '../RowContext';

import { columnHelper } from './helper';

export const memory = columnHelper.display({
  header: 'Memory',
  id: 'memory',
  cell: MemoryCell,
  enableHiding: true,
});

function MemoryCell({
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

  const { memoryUsage, memoryLimit } = metricsQuery.data;
  return (
    <>
      {humanize(memoryUsage)} / {humanize(memoryLimit)}
    </>
  );
}
