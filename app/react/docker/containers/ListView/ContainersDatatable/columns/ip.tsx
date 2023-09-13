import { columnHelper } from './helper';

export const ip = columnHelper.accessor((row) => row.IP || '-', {
  header: 'IP Address',
  id: 'ip',
});
