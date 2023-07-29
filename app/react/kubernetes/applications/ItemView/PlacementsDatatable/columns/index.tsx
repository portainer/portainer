import { buildExpandColumn } from '@@/datatables/expand-column';

import { Node } from '../../types';

import { columnHelper } from './helper';
import { status } from './status';

export const columns = [
  buildExpandColumn<Node>(),
  status,
  columnHelper.accessor('Name', {
    header: 'Node',
    id: 'node',
  }),
];
