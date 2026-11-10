import { getNodeGroup } from '../../../nodeUtils';

import { columnHelper } from './helper';

export const nodeGroup = columnHelper.accessor(
  (row) => getNodeGroup(row) ?? '',
  {
    header: 'Node group',
    id: 'nodeGroup',
    cell: ({ getValue }) => getValue() || '-',
  }
);
