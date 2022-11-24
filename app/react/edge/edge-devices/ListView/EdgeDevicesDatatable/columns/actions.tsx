import { CellProps, Column } from 'react-table';
import { MenuItem, MenuLink } from '@reach/menu-button';
import { useRouter, useSref } from '@uirouter/react';

import { Environment } from '@/react/portainer/environments/types';
import { snapshotEndpoint } from '@/react/portainer/environments/environment.service';
import * as notifications from '@/portainer/services/notifications';
import { getDashboardRoute } from '@/react/portainer/environments/utils';

import { ActionsMenu } from '@@/datatables/ActionsMenu';

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
}: CellProps<Environment>) {
  const router = useRouter();

  const environmentRoute = getDashboardRoute(environment);
  const browseLinkProps = useSref(environmentRoute, {
    id: environment.Id,
    endpointId: environment.Id,
  });

  const snapshotLinkProps = useSref('edge.browse.dashboard', {
    environmentId: environment.Id,
  });

  const showRefreshSnapshot = false; // remove and show MenuItem when feature is available

  return (
    <ActionsMenu>
      {environment.Edge.AsyncMode ? (
        <MenuLink
          className="!text-inherit hover:!no-underline"
          href={snapshotLinkProps.href}
          onClick={snapshotLinkProps.onClick}
        >
          Browse Snapshot
        </MenuLink>
      ) : (
        <MenuLink href={browseLinkProps.href} onClick={browseLinkProps.onClick}>
          Browse
        </MenuLink>
      )}
      {showRefreshSnapshot && (
        <MenuItem hidden onSelect={() => handleRefreshSnapshotClick()}>
          Refresh Snapshot
        </MenuItem>
      )}
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
