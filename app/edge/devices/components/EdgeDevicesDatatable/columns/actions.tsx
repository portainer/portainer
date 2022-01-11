import { Column } from 'react-table';
import { MenuItem } from '@reach/menu-button';

import { Environment } from '@/portainer/environments/types';
import { ActionsMenu } from '@/portainer/components/datatables/components/ActionsMenu';

export const actions: Column<Environment> = {
  Header: 'Actions',
  accessor: () => 'actions',
  id: 'actions',
  disableFilters: true,
  canHide: true,
  sortType: 'string',
  Filter: () => null,
  Cell: ActionsCell,
};

export function ActionsCell() {
  return (
    <ActionsMenu>
      <div>
        <MenuItem onSelect={() => {}}>Browse</MenuItem>
        <MenuItem onSelect={() => {}}>Refresh Snapshot</MenuItem>
      </div>
    </ActionsMenu>
  );
}
