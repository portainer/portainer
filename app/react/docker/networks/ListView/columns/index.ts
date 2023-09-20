import _ from 'lodash';
import { useMemo } from 'react';

import { createOwnershipColumn } from '@/react/docker/components/datatable/createOwnershipColumn';

import { buildExpandColumn } from '@@/datatables/expand-column';

import { DecoratedNetwork } from '../types';

import { columnHelper } from './helper';
import { name } from './name';

export function useColumns(isHostColumnVisible?: boolean) {
  return useMemo(
    () =>
      _.compact([
        buildExpandColumn<DecoratedNetwork>(),
        name,
        columnHelper.accessor((item) => item.StackName || '-', {
          header: 'Stack',
        }),
        columnHelper.accessor('Driver', {
          header: 'Driver',
        }),
        columnHelper.accessor('Attachable', {
          header: 'Attachable',
        }),
        columnHelper.accessor('IPAM.Driver', {
          header: 'IPAM Driver',
        }),
        columnHelper.accessor(
          (item) => item.IPAM?.IPV4Configs?.[0]?.Subnet ?? '-',
          {
            header: 'IPV4 IPAM Subnet',
          }
        ),
        columnHelper.accessor(
          (item) => item.IPAM?.IPV4Configs?.[0]?.Gateway ?? '-',
          {
            header: 'IPV4 IPAM Gateway',
          }
        ),
        columnHelper.accessor(
          (item) => item.IPAM?.IPV6Configs?.[0]?.Subnet ?? '-',
          {
            header: 'IPV6 IPAM Subnet',
          }
        ),
        columnHelper.accessor(
          (item) => item.IPAM?.IPV6Configs?.[0]?.Gateway ?? '-',
          {
            header: 'IPV6 IPAM Gateway',
          }
        ),
        isHostColumnVisible &&
          columnHelper.accessor('NodeName', {
            header: 'Node',
          }),
        createOwnershipColumn<DecoratedNetwork>(),
      ]),
    [isHostColumnVisible]
  );
}
