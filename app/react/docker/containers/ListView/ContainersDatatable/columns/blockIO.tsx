import { CellContext } from '@tanstack/react-table';

import type { ContainerListViewModel } from '@/react/docker/containers/types';
import { useContainerMetricById } from '@/react/docker/containers/queries/useContainerMetrics';
import { humanize } from '@/portainer/filters/filters';

import { useRowContext } from '../RowContext';

import { columnHelper } from './helper';

export const blockIO = columnHelper.display({
  header: 'Block I/O',
  id: 'blockIO',
  cell: BlockIOCell,
  enableHiding: true,
});

function BlockIOCell({
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

  if (!metricsQuery.data.blkioAvailable) {
    return <>Not Available</>;
  }

  const { blockReadRate, blockWriteRate } = metricsQuery.data;
  return (
    <>
      {humanize(blockReadRate)}/s R / {humanize(blockWriteRate)}/s W
    </>
  );
}
