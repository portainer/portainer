import { columnHelper } from './helper';

export const host = columnHelper.accessor((row) => row.NodeName || '-', {
  header: 'Host',
  id: 'host',
});
