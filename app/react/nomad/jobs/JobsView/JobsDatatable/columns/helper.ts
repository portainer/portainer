import { createColumnHelper } from '@tanstack/react-table';

import { Job } from '@/react/nomad/types';

export const columnHelper = createColumnHelper<Job>();
