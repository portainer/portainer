import { buildExpandColumn } from '@@/datatables/expand-column';
import { buildNameColumn } from '@@/datatables/buildNameColumn';

import { TableNetwork } from './types';
import { columnHelper } from './helper';
import { actions } from './actions';

export const columns = [
  buildExpandColumn<TableNetwork>(),
  {
    ...buildNameColumn<TableNetwork>(
      'name',
      'docker.networks.network',
      'docker-networks-name'
    ),
    header: 'Network',
  },
  columnHelper.accessor((item) => item.IPAddress || '-', {
    header: 'IP Address',
    id: 'ip',
    enableSorting: false,
  }),
  columnHelper.accessor((item) => item.Gateway || '-', {
    header: 'Gateway',
    id: 'gateway',
    enableSorting: false,
  }),
  columnHelper.accessor((item) => item.MacAddress || '-', {
    header: 'MAC Address',
    id: 'macAddress',
    enableSorting: false,
  }),
  actions,
];
