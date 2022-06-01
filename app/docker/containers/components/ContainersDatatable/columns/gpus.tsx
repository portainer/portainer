import { Column } from 'react-table';

import type { DockerContainer } from '@/docker/containers/types';

export const gpus: Column<DockerContainer> = {
  Header: 'GPUs',
  accessor: 'Gpus',
  id: 'gpus',
  disableFilters: true,
  canHide: true,
  Filter: () => null,
};
