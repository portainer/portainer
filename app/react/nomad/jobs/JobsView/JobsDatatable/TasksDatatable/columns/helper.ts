import { createColumnHelper } from '@tanstack/react-table';

import { Task } from '@/react/nomad/types';

export const columnHelper = createColumnHelper<Task>();
