import { columnHelper } from './helper';

export const version = columnHelper.accessor(
  (row) => row.status?.nodeInfo?.kubeletVersion ?? '',
  {
    header: 'Version',
    cell: ({ row: { original: node } }) =>
      node.status?.nodeInfo?.kubeletVersion ?? '',
  }
);
