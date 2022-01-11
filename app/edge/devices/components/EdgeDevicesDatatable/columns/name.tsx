import { CellProps, Column, TableInstance } from 'react-table';

import { Environment } from '@/portainer/environments/types';
import { Link } from '@/portainer/components/Link';
import { arrowClass } from '@/portainer/components/datatables/utils';

export const name: Column<Environment> = {
  Header: 'Name',
  accessor: (row) => row.Name,
  id: 'name',
  Cell: NameCell,
  disableFilters: true,
  Filter: () => null,
  canHide: false,
  sortType: 'string',
};

export function NameCell({ value: name, row }: CellProps<TableInstance>) {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <div {...row.getToggleRowExpandedProps({})}>
      <i
        className={`fas ${arrowClass(row.isExpanded)} space-right`}
        aria-hidden="true"
      />
      <Link
        to="portainer.endpoints.endpoint"
        params={{ id: row.original.Id }}
        title={name}
      >
        {name}
      </Link>
    </div>
  );
}
