import { isoDate } from '@/portainer/filters/filters';

import { actions } from './actions';
import { columnHelper } from './helper';
import { node } from './node';
import { status } from './status';
import { task } from './task';

export const columns = [
  status,
  task,
  actions,
  columnHelper.accessor((item) => item.Slot || '-', { header: 'Slot' }),
  node,
  columnHelper.accessor('Updated', {
    header: 'Last Update',
    cell: ({ getValue }) => isoDate(getValue()),
  }),
];
