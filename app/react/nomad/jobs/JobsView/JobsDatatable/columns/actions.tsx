import { CellProps, Column } from 'react-table';

import { Job } from '@/react/nomad/types';

export const actions: Column<Job> = {
  Header: 'Job Actions',
  id: 'actions',
  disableFilters: true,
  canHide: true,
  disableResizing: true,
  width: '110px',
  sortType: 'string',
  Filter: () => null,
  Cell: ActionsCell,
};

export function ActionsCell({ row }: CellProps<Job>) {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <div className="text-center" {...row.getToggleRowExpandedProps()}>
      <i className="fa fa-history space-right" aria-hidden="true" />
    </div>
  );
}
