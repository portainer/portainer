import { CellProps, Column, TableInstance } from 'react-table';
import { MenuItem, MenuLink } from '@reach/menu-button';
import { useSref } from '@uirouter/react';

import { Environment } from '@/portainer/environments/types';
import { ActionsMenu } from '@/portainer/components/datatables/components/ActionsMenu';

export const actions: Column<Environment> = {
  Header: 'Actions',
  accessor: () => 'actions',
  id: 'actions',
  disableFilters: true,
  canHide: true,
  disableResizing: true,
  width: '5px',
  sortType: 'string',
  Filter: () => null,
  Cell: ActionsCell,
};

export function ActionsCell({
  row: { original: environment },
}: CellProps<TableInstance>) {
  const browseLinkProps = useSref('portainer.endpoints.endpoint', {
    id: environment.Id,
  });

  return (
    <ActionsMenu>
      <MenuLink href={browseLinkProps.href} onClick={browseLinkProps.onClick}>
        Browse
      </MenuLink>
      <MenuItem onSelect={() => {}}>Refresh Snapshot</MenuItem>
    </ActionsMenu>
  );
}
