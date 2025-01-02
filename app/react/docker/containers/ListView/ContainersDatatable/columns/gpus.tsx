import { CellContext } from '@tanstack/react-table';

import type { ContainerListViewModel } from '@/react/docker/containers/types';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useContainerGpus } from '@/react/docker/containers/queries/gpus';

import { columnHelper } from './helper';

export const gpus = columnHelper.display({
  header: 'GPUs',
  id: 'gpus',
  cell: GpusCell,
});

function GpusCell({
  row: { original: container },
}: CellContext<ContainerListViewModel, unknown>) {
  const containerId = container.Id;
  const environmentId = useEnvironmentId();
  const gpusQuery = useContainerGpus(environmentId, containerId);

  if (!gpusQuery.data) {
    return null;
  }

  return <>{gpusQuery.data}</>;
}
