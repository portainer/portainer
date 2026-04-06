import { createColumnHelper, CellContext } from '@tanstack/react-table';
import { Users } from 'lucide-react';

import i18n from '@/i18n';
import { useCurrentUser } from '@/react/hooks/useUser';

import { Icon } from '@@/Icon';
import { Link } from '@@/Link';

import { AccessViewerPolicyModel } from './model';

const helper = createColumnHelper<AccessViewerPolicyModel>();

export const columns = [
  helper.accessor('EndpointName', {
    header: i18n.t('roles.environment') as string,
    id: 'Environment',
  }),
  helper.accessor('RoleName', {
    header: i18n.t('portainer_access.role') as string,
    id: 'Role',
  }),
  helper.display({
    header: i18n.t('roles.access_origin') as string,
    cell: AccessCell,
  }),
];

function AccessCell({
  row: { original: item },
}: CellContext<AccessViewerPolicyModel, unknown>) {
  const { isPureAdmin } = useCurrentUser();

  if (item.RoleId === 0) {
    return (
      <>
        {i18n.t('roles.user_access_all_environments')}
        <Link
          to="portainer.settings.edgeCompute"
          data-cy={`manage-access-button-${item.RoleName}`}
        >
          <Icon icon={Users} /> {i18n.t('roles.manage_access')}
        </Link>
      </>
    );
  }

  return (
    <>
      {prefix(item.TeamName)} {i18n.t('roles.access_defined_on')} {item.AccessLocation}{' '}
      {!!item.GroupName && <code>{item.GroupName}</code>}{' '}
      {manageAccess(item, isPureAdmin)}
    </>
  );
}

function prefix(teamName: string | undefined) {
  if (!teamName) {
    return i18n.t('roles.user_prefix');
  }
  return (
    <>
      {i18n.t('roles.team_prefix')} <code>{teamName}</code>
    </>
  );
}

function manageAccess(item: AccessViewerPolicyModel, isPureAdmin: boolean) {
  if (!isPureAdmin) {
    return null;
  }

  return item.GroupName ? (
    <Link
      to="portainer.groups.group.access"
      params={{ id: item.GroupId }}
      data-cy={`manage-access-button-${item.RoleName}`}
    >
      <Icon icon={Users} /> {i18n.t('roles.manage_access')}
    </Link>
  ) : (
    <Link
      to="portainer.endpoints.endpoint.access"
      params={{ id: item.EndpointId }}
      data-cy={`manage-access-button-${item.RoleName}`}
    >
      <Icon icon={Users} /> {i18n.t('roles.manage_access')}
    </Link>
  );
}
