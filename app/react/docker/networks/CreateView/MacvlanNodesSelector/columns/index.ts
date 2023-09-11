import _ from 'lodash';

import { columnHelper } from './column-helper';
import { name } from './name';
import { status } from './status';

export function useColumns(isIpColumnVisible: boolean) {
  return _.compact([
    name,
    columnHelper.accessor('Role', {}),
    columnHelper.accessor('EngineVersion', {
      header: 'Engine',
    }),
    isIpColumnVisible &&
      columnHelper.accessor('Addr', {
        header: 'IP Address',
      }),
    status,
  ]);
}
