import { columnHelper } from './helper';

export const namespace = columnHelper.accessor('Namespace', {
  header: 'Namespace',
  id: 'namespace',
  cell: ({ getValue }) => {
    const value = getValue();
    return value || '-';
  },
});
