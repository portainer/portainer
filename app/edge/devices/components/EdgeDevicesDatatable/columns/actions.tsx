import { CellProps, Column, TableInstance } from 'react-table';
import { MenuItem } from '@reach/menu-button';
import { useRouter } from '@uirouter/react';

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

export function ActionsCell({
  row: { original: environment },
}: CellProps<TableInstance>) {
  const router = useRouter();
  return (
    <ActionsMenu>
      <MenuItem onSelect={() => handleBrowseClick()}>Browse</MenuItem>
      <MenuItem onSelect={() => {}}>Refresh Snapshot</MenuItem>
    </ActionsMenu>
  );

  function handleBrowseClick() {
    router.stateService.go('portainer.endpoints.endpoint', {
      id: environment.Id,
    });
  }
}
