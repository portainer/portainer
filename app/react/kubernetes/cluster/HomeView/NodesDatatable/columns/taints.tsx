import { getNodeTaintStrings } from '../../../nodeUtils';

import { BadgeListCell } from './BadgeListCell';
import { columnHelper } from './helper';

export const taints = columnHelper.accessor(
  (row) => getNodeTaintStrings(row).join(' '),
  {
    header: 'Taints',
    id: 'taints',
    enableSorting: false,
    cell: ({ row: { original: node } }) => (
      <BadgeListCell values={getNodeTaintStrings(node)} />
    ),
  }
);
