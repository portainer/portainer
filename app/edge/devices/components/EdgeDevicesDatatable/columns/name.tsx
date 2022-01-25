import { CellProps, Column, TableInstance } from 'react-table';

import { Environment } from '@/portainer/environments/types';
import { Link } from '@/portainer/components/Link';
import { ExpandingCell } from '@/portainer/components/datatables/components/ExpandingCell';

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
    <ExpandingCell row={row}>
      <Link
        to="portainer.endpoints.endpoint"
        params={{ id: row.original.Id }}
        title={name}
      >
        {name}
      </Link>
    </ExpandingCell>
  );
}
