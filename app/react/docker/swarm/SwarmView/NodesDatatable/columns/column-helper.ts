import { createColumnHelper } from '@tanstack/react-table';

import { NodeViewModel } from '@/docker/models/node';

export const columnHelper = createColumnHelper<NodeViewModel>();
