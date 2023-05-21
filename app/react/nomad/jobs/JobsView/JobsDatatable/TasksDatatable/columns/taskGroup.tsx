import { columnHelper } from './helper';

export const taskGroup = columnHelper.accessor('TaskGroup', {
  header: 'Task Group',
  id: 'taskGroup',
  cell: ({ getValue }) => {
    const value = getValue();
    return value || '-';
  },
});
