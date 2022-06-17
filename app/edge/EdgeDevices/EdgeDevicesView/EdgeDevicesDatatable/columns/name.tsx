import { CellProps, Column } from 'react-table';

import { Environment } from '@/portainer/environments/types';

import { Link } from '@@/Link';
import { ExpandingCell } from '@@/datatables/ExpandingCell';

import { useRowContext } from './RowContext';

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

export function NameCell({ value: name, row }: CellProps<Environment>) {
  const { isOpenAmtEnabled } = useRowContext();
  const showExpandedRow = !!(
    isOpenAmtEnabled &&
    row.original.AMTDeviceGUID &&
    row.original.AMTDeviceGUID.length > 0
  );
  return (
    <ExpandingCell row={row} showExpandArrow={showExpandedRow}>
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
