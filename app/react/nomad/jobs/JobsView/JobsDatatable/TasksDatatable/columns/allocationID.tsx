import { columnHelper } from './helper';

export const allocationID = columnHelper.accessor('AllocationID', {
  header: 'Allocation ID',
  id: 'allocationID',
  cell: ({ getValue }) => {
    const value = getValue();
    return value || '-';
  },
});
