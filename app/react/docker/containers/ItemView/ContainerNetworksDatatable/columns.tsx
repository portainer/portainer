import i18n from '@/i18n';

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
      id: 'name',
      header: () => i18n.t('docker.containers.network_details.network'),
    },
    columnHelper.accessor((item) => item.IPAddress || '-', {
      header: () => i18n.t('docker.containers.network_details.ip_address'),
      id: 'ip',
      enableSorting: false,
    }),
    columnHelper.accessor((item) => item.Gateway || '-', {
      header: () => i18n.t('docker.containers.network_details.gateway'),
      id: 'gateway',
      enableSorting: false,
    }),
    columnHelper.accessor((item) => item.MacAddress || '-', {
      header: () => i18n.t('docker.containers.network_details.mac_address'),
      id: 'macAddress',
      enableSorting: false,
    }),
    buildActions({ nodeName }),
  ];
}
