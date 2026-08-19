import { buildExpandColumn } from '@@/datatables/expand-column';

import { CronJob } from '../types';

import { columnHelper } from './helper';

export const expand = columnHelper.display({
  ...buildExpandColumn<CronJob>(),
  id: 'expand',
});
