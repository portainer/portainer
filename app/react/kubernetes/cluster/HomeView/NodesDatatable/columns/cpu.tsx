import { parseCpu } from '@/react/kubernetes/utils';

import { NodeRowData } from '../types';

import { columnHelper } from './helper';

export const cpu = columnHelper.accessor((row) => getCPU(row), {
  header: 'CPU',
  cell: ({ row: { original: node } }) => getCPU(node),
});

function getCPU(node: NodeRowData) {
  return parseCpu(node.status?.allocatable?.cpu ?? '');
}
