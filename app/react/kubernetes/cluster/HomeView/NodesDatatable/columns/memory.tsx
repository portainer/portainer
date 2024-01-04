import filesizeParser from 'filesize-parser';

import { humanize } from '@/portainer/filters/filters';

import { NodeRowData } from '../types';

import { columnHelper } from './helper';

export const memory = columnHelper.accessor((row) => getMemory(row), {
  header: 'Memory',
  cell: ({ row: { original: node } }) => getMemory(node),
});

function getMemory(node: NodeRowData) {
  return humanize(filesizeParser(node.status?.allocatable?.memory ?? ''));
}
