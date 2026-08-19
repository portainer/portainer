import _ from 'lodash';
import { useMemo } from 'react';

import { humanize } from '@/portainer/filters/filters';

import { columnHelper } from './column-helper';
import { name } from './name';
import { status } from './status';
import { availability } from './availability';

export { name, status };

export const role = columnHelper.accessor('Role', {});

export const engine = columnHelper.accessor('EngineVersion', {
  header: 'Engine',
});

export const ip = columnHelper.accessor('Addr', {
  header: 'IP Address',
});

export const cpu = columnHelper.accessor(
  (item) => (item.CPUs ? item.CPUs / 1000000000 : 0),
  {
    header: 'CPU',
  }
);

export const memory = columnHelper.accessor('Memory', {
  header: 'Memory',
  cell({ getValue }) {
    const value = getValue();
    return humanize(value);
  },
});

export function useColumns(isIpColumnVisible: boolean) {
  return useMemo(
    () =>
      _.compact([
        name,
        role,
        cpu,
        memory,
        engine,
        isIpColumnVisible && ip,
        status,
        availability,
      ]),
    [isIpColumnVisible]
  );
}
