import { getInstanceType } from '../../../nodeUtils';

import { columnHelper } from './helper';

export const instanceType = columnHelper.accessor(
  (row) => getInstanceType(row) ?? '',
  {
    header: 'Instance type',
    id: 'instanceType',
    cell: ({ getValue }) => getValue() || '-',
  }
);
