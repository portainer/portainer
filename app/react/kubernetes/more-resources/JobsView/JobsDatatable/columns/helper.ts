import { createColumnHelper } from '@tanstack/react-table';

import { Job } from '../types';

export const columnHelper = createColumnHelper<Job>();
