import clsx from 'clsx';
import { PropsWithChildren } from 'react';
import _ from 'lodash';
import { Info } from 'lucide-react';
import { useTranslation, TFunction } from 'react-i18next';

import { truncate } from '@/portainer/filters/filters';
import { UserId } from '@/portainer/users/types';
import { TeamId } from '@/react/portainer/users/teams/types';
import { useTeams } from '@/react/portainer/users/teams/queries';
import { useUsers } from '@/portainer/users/queries';
import { ownershipIcon } from '@/react/docker/components/datatable/createOwnershipColumn';

import { Link } from '@@/Link';
import { Tooltip } from '@@/Tip/Tooltip';
import { Icon } from '@@/Icon';

import {
  ResourceControlOwnership,
  ResourceControlType,
  ResourceId,
} from '../types';
import { ResourceControlViewModel } from '../models/ResourceControlViewModel';

interface Props {
  resourceControl?: ResourceControlViewModel;
  resourceType: ResourceControlType;
  isAuthorisedToFetchUsers?: boolean;
}

export function AccessControlPanelDetails({
  resourceControl,
  resourceType,
  isAuthorisedToFetchUsers = false,
}: Props) {
  const { t } = useTranslation();
  const inheritanceMessage = getInheritanceMessage(
    resourceType,
    resourceControl,
    t
  );

  const {
    Ownership: ownership = ResourceControlOwnership.ADMINISTRATORS,
    UserAccesses: restrictedToUsers = [],
    TeamAccesses: restrictedToTeams = [],
  } = resourceControl || {};

  const users = useAuthorizedUsers(
    restrictedToUsers.map((ra) => ra.UserId),
    isAuthorisedToFetchUsers
  );
  const teams = useAuthorizedTeams(restrictedToTeams.map((ra) => ra.TeamId));

  const teamsLength = teams.data ? teams.data.length : 0;
  const unauthoisedTeams = restrictedToTeams.length - teamsLength;

  let teamsMessage = teams.data && teams.data.join(', ');
  if (unauthoisedTeams > 0 && teams.isFetched) {
    teamsMessage += teamsLength > 0 ? ' and' : '';
    teamsMessage += ` ${t('access_control.teams_not_part_of', { count: unauthoisedTeams })}`;
  }

  const userMessage = users.data
    ? users.data.join(', ')
    : t('access_control.users_count', { count: restrictedToUsers.length });

  return (
    <table className="table">
      <tbody>
        <tr data-cy="access-ownership">
          <td className="w-1/5">{t('access_control.ownership_label')}</td>
          <td>
            <i
              className={clsx(ownershipIcon(ownership), 'space-right')}
              aria-hidden="true"
              aria-label="ownership-icon"
            />
            <span aria-label="ownership">{ownership}</span>
            <Tooltip message={getOwnershipTooltip(ownership, t)} />
          </td>
        </tr>
        {inheritanceMessage}
        {restrictedToUsers.length > 0 && (
          <tr data-cy="access-authorisedUsers">
            <td>{t('access_control.authorized_users_label')}</td>
            <td aria-label="authorized-users">{userMessage}</td>
          </tr>
        )}
        {restrictedToTeams.length > 0 && (
          <tr data-cy="access-authorisedTeams">
            <td>{t('access_control.authorized_teams_label')}</td>
            <td aria-label="authorized-teams">{teamsMessage}</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function getOwnershipTooltip(
  ownership: ResourceControlOwnership,
  t: TFunction
) {
  switch (ownership) {
    case ResourceControlOwnership.PRIVATE:
      return t('access_control.ownership_tooltip_private');
    case ResourceControlOwnership.RESTRICTED:
      return t('access_control.ownership_tooltip_restricted');
    case ResourceControlOwnership.PUBLIC:
      return t('access_control.ownership_tooltip_public');
    case ResourceControlOwnership.ADMINISTRATORS:
    default:
      return t('access_control.ownership_tooltip_admin');
  }
}

function getInheritanceMessage(
  resourceType: ResourceControlType,
  resourceControl: ResourceControlViewModel | undefined,
  t: TFunction
) {
  if (!resourceControl || resourceControl.Type === resourceType) {
    return null;
  }

  const parentType = resourceControl.Type;
  const resourceId = resourceControl.ResourceId;

  if (
    resourceType === ResourceControlType.Container &&
    parentType === ResourceControlType.Service
  ) {
    return (
      <InheritanceMessage tooltip={t('access_control.inheritance_service_tooltip')}>
        {t('access_control.inheritance_service_msg')}
        <Link
          to="docker.services.service"
          params={{ id: resourceId }}
          data-cy="docker-access-inherited-service"
          title={String(resourceId)}
        >
          {truncate(resourceId)}
        </Link>
      </InheritanceMessage>
    );
  }

  if (
    resourceType === ResourceControlType.Volume &&
    parentType === ResourceControlType.Container
  ) {
    return (
      <InheritanceMessage tooltip={t('access_control.inheritance_container_tooltip')}>
        {t('access_control.inheritance_container_msg')}
        <Link
          to="docker.containers.container"
          params={{ id: resourceId }}
          data-cy="docker-access-inherited-container"
          title={String(resourceId)}
        >
          {truncate(resourceId)}
        </Link>
      </InheritanceMessage>
    );
  }

  if (parentType === ResourceControlType.Stack) {
    return (
      <InheritanceMessage tooltip={t('access_control.inheritance_stack_tooltip')}>
        <span className="space-right">
          {t('access_control.inheritance_stack_msg')}
        </span>
        {removeEndpointIdFromStackResourceId(resourceId)}
      </InheritanceMessage>
    );
  }

  return null;
}

function removeEndpointIdFromStackResourceId(stackName: ResourceId) {
  if (!stackName || typeof stackName !== 'string') {
    return stackName;
  }

  const firstUnderlineIndex = stackName.indexOf('_');
  if (firstUnderlineIndex < 0) {
    return stackName;
  }
  return stackName.substring(firstUnderlineIndex + 1);
}

interface InheritanceMessageProps {
  tooltip: string;
}

function InheritanceMessage({
  children,
  tooltip,
}: PropsWithChildren<InheritanceMessageProps>) {
  return (
    <tr>
      <td colSpan={2} aria-label="inheritance-message">
        <div className="inline-flex items-center gap-1">
          <Icon icon={Info} mode="primary" />
          {children}
        </div>
        <Tooltip message={tooltip} />
      </td>
    </tr>
  );
}

function useAuthorizedTeams(authorizedTeamIds: TeamId[]) {
  return useTeams(false, 0, {
    enabled: authorizedTeamIds.length > 0,
    select: (teams) => {
      if (authorizedTeamIds.length === 0) {
        return [];
      }

      return _.compact(
        authorizedTeamIds.map((id) => {
          const team = teams.find((u) => u.Id === id);
          return team?.Name;
        })
      );
    },
  });
}

function useAuthorizedUsers(authorizedUserIds: UserId[], enabled = true) {
  return useUsers(
    false,
    0,
    authorizedUserIds.length > 0 && enabled,
    (users) => {
      if (authorizedUserIds.length === 0) {
        return [];
      }

      return _.compact(
        authorizedUserIds.map((id) => {
          const user = users.find((u) => u.Id === id);
          return user?.Username;
        })
      );
    }
  );
}
