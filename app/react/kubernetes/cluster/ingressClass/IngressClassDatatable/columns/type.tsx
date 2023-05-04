import { columnHelper } from './helper';

export const type = columnHelper.accessor('Type', {
  header: 'Ingress controller type',
  cell: ({ getValue }) => {
    const type = getValue();
    return type || '-';
  },
  id: 'type',
});
