import { createColumnHelper } from '@tanstack/react-table';

import i18n from '@/i18n';
import { isoDateFromTimestamp } from '@/portainer/filters/filters';

import { buildNameColumn } from '@@/datatables/buildNameColumn';

import { EdgeJob } from '../types';

const columnHelper = createColumnHelper<EdgeJob>();

export const columns = [
  buildNameColumn<EdgeJob>('Name', '.job', 'edge-job-name'),
  columnHelper.accessor('CronExpression', {
    header: () => i18n.t('edge.jobs.columns.cron_expression'),
  }),
  columnHelper.accessor('Created', {
    header: () => i18n.t('edge.jobs.columns.created'),
    cell: ({ getValue }) => isoDateFromTimestamp(getValue()),
  }),
];
