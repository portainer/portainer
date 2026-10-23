import { createColumnHelper, CellContext } from '@tanstack/react-table';
import { Users } from 'lucide-react';

import { useCurrentUser } from '@/react/hooks/useUser';

import { Icon } from '@@/Icon';
import { Link } from '@@/Link';

import { AccessLocation, AccessViewerPolicyModel } from './model';

const ACCESS_LOCATION_LABELS: Record<AccessLocation, string> = {
  [AccessLocation.Environment]: 'environment',
  [AccessLocation.EnvironmentGroup]: 'environment group',
};

const helper = createColumnHelper<AccessViewerPolicyModel>();

export const columns = [
  helper.accessor('endpointName', {
    header: 'Environment',
    id: 'Environment',
  }),
  helper.accessor('roleName', {
    header: 'Role',
    id: 'Role',
  }),
  helper.display({
    header: 'Access Origin',
    cell: AccessCell,
  }),
];

const manageAccessLabel = (
  <span className="inline-flex items-center gap-1">
    <Icon icon={Users} />
    Manage access
  </span>
);

function AccessCell({
  row: { original: item },
}: CellContext<AccessViewerPolicyModel, unknown>) {
  const { isPureAdmin } = useCurrentUser();

  if (item.roleId === 0) {
    return (
      <>
        User access all environments
        <div>
          <Link
            to="portainer.settings.edgeCompute"
            data-cy={`manage-access-button-${item.roleName}`}
          >
            {manageAccessLabel}
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      {prefix(item.teamName)} access defined on{' '}
      {ACCESS_LOCATION_LABELS[item.accessLocation]}{' '}
      {!!item.groupName && <code>{item.groupName}</code>}
      <div>{manageAccess(item, isPureAdmin)}</div>
    </>
  );
}

function prefix(teamName: string | undefined) {
  if (!teamName) {
    return 'User';
  }
  return (
    <>
      Team <code>{teamName}</code>
    </>
  );
}

function manageAccess(item: AccessViewerPolicyModel, isPureAdmin: boolean) {
  if (!isPureAdmin) {
    return null;
  }

  if (item.groupName) {
    return (
      <Link
        to="portainer.groups.group"
        params={{ id: item.groupId, tab: 'access' }}
        data-cy={`manage-access-button-${item.roleName}`}
      >
        {manageAccessLabel}
      </Link>
    );
  }

  return (
    <Link
      to="portainer.endpoints.endpoint.access"
      params={{ id: item.endpointId }}
      data-cy={`manage-access-button-${item.roleName}`}
    >
      {manageAccessLabel}
    </Link>
  );
}
