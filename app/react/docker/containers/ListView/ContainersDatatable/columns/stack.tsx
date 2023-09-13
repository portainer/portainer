import { columnHelper } from './helper';

export const stack = columnHelper.accessor((row) => row.StackName || '-', {
  header: 'Stack',
  id: 'stack',
});
