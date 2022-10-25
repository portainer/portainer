import { createColumnHelper } from '@tanstack/react-table';

import { DockerNetworkViewModel } from '../types';

export const columnHelper = createColumnHelper<DockerNetworkViewModel>();
