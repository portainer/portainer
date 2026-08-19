import { createColumnHelper } from '@tanstack/react-table';

import { CronJob } from '../types';

export const columnHelper = createColumnHelper<CronJob>();
