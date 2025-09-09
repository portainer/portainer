import {
  bytesToReadableFormat,
  safeFilesizeParser,
} from '@/react/kubernetes/utils';

import { NodeRowData } from '../types';

import { columnHelper } from './helper';

export const memory = columnHelper.accessor((row) => getMemory(row), {
  header: 'Memory',
  cell: ({ row: { original: node } }) => getMemory(node),
});

function getMemory(node: NodeRowData) {
  return bytesToReadableFormat(
    safeFilesizeParser(node.status?.allocatable?.memory ?? ''),
    {
      standard: 'iec',
      exponent: 2, // MiB
      round: 0,
    }
  );
}
