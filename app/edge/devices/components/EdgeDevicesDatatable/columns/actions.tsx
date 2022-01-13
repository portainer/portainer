import { CellProps, Column, TableInstance } from 'react-table';
import { MenuItem, MenuLink } from '@reach/menu-button';
import {useRouter, useSref} from '@uirouter/react';

import { Environment } from '@/portainer/environments/types';
import { ActionsMenu } from '@/portainer/components/datatables/components/ActionsMenu';
import {snapshotEndpoint} from "@/portainer/environments/environment.service";
import * as notifications from "@/portainer/services/notifications";

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

  const router = useRouter();
  const browseLinkProps = useSref('portainer.endpoints.endpoint', {
    id: environment.Id,
  });

  return (
    <ActionsMenu>
      <MenuLink href={browseLinkProps.href} onClick={browseLinkProps.onClick}>
        Browse
      </MenuLink>
      <MenuItem onSelect={() => handleRefreshSnapshotClick()}>Refresh Snapshot</MenuItem>
    </ActionsMenu>
  );

  async function handleRefreshSnapshotClick() {
    try {
      await snapshotEndpoint(environment.Id);
      notifications.success('Success', 'Environment updated');
    } catch (err) {
      notifications.error(
          'Failure',
          err as Error,
          'An error occurred during environment snapshot'
      );
    } finally {
      await router.stateService.reload();
    }
  }
}
