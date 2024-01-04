import { getInternalNodeIpAddress } from '../utils';

import { columnHelper } from './helper';

export const ip = columnHelper.accessor(
  (row) => getInternalNodeIpAddress(row) ?? '-',
  {
    header: 'IP Address',
    cell: ({ row }) => getInternalNodeIpAddress(row.original) ?? '-',
  }
);
