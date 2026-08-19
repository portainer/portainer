import { createColumnHelper } from '@tanstack/react-table';

import { isoDateFromTimestamp } from '@/portainer/filters/filters';

import { buildNameColumn } from '@@/datatables/buildNameColumn';

import { EdgeJob } from '../types';

const columnHelper = createColumnHelper<EdgeJob>();

export const columns = [
  buildNameColumn<EdgeJob>('Name', '.job', 'edge-job-name'),
  columnHelper.accessor('CronExpression', {
    header: 'Cron Expression',
  }),
  columnHelper.accessor('Created', {
    header: 'Created',
    cell: ({ getValue }) => isoDateFromTimestamp(getValue()),
  }),
];
