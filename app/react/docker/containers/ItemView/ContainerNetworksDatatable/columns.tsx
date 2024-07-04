import { buildExpandColumn } from '@@/datatables/expand-column';
import { buildNameColumnFromObject } from '@@/datatables/buildNameColumn';

import { TableNetwork } from './types';
import { columnHelper } from './helper';
import { buildActions } from './actions';

export function buildColumns({ nodeName }: { nodeName?: string } = {}) {
  return [
    buildExpandColumn<TableNetwork>(),
    {
      ...buildNameColumnFromObject<TableNetwork>({
        nameKey: 'name',
        path: 'docker.networks.network',
        dataCy: 'docker-networks-name',
        linkParamsBuilder: () => ({ nodeName }),
      }),
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
    buildActions({ nodeName }),
  ];
}
