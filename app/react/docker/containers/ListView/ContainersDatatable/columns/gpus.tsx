import { CellProps, Column } from 'react-table';

import type { DockerContainer } from '@/react/docker/containers/types';
import { useEnvironmentId } from '@/portainer/hooks/useEnvironmentId';
import { useContainerGpus } from '@/react/docker/containers/queries/gpus';

export const gpus: Column<DockerContainer> = {
  Header: 'GPUs',
  id: 'gpus',
  disableFilters: true,
  canHide: true,
  Filter: () => null,
  Cell: GpusCell,
};

function GpusCell({
  row: { original: container },
}: CellProps<DockerContainer>) {
  const containerId = container.Id;
  const environmentId = useEnvironmentId();
  const gpusQuery = useContainerGpus(environmentId, containerId);

  if (!gpusQuery.data) {
    return null;
  }

  return <>{gpusQuery.data}</>;
}
