import { useReducer } from 'react';
import { Edit, Eye } from 'lucide-react';

import { Icon } from '@/react/components/Icon';
import { TeamMembership, TeamRole } from '@/react/portainer/users/teams/types';
import {
  useIsCurrentUserTeamLeader,
  useUserMembership,
} from '@/portainer/users/queries';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { useCurrentUser, useIsEdgeAdmin } from '@/react/hooks/useUser';

import { TableContainer, TableTitle } from '@@/datatables';
import { Button } from '@@/buttons';

import { ResourceControlType, ResourceId } from '../types';
import { ResourceControlViewModel } from '../models/ResourceControlViewModel';

import { AccessControlPanelDetails } from './AccessControlPanelDetails';
import { AccessControlPanelForm } from './AccessControlPanelForm';

interface Props {
  resourceControl?: ResourceControlViewModel;
  resourceType: ResourceControlType;
  resourceId: ResourceId;
  environmentId: EnvironmentId;
  disableOwnershipChange?: boolean;
  onUpdateSuccess(): Promise<void>;
}

export function AccessControlPanel({
  resourceControl,
  resourceType,
  disableOwnershipChange,
  resourceId,
  environmentId,
  onUpdateSuccess,
}: Props) {
  const [isEditMode, toggleEditMode] = useReducer((state) => !state, false);
  const isAdminQuery = useIsEdgeAdmin();
  const isTeamLeader = useIsCurrentUserTeamLeader();

  const isInherited = checkIfInherited();

  const restrictions = useRestrictions(resourceControl);

  if (isAdminQuery.isLoading || !restrictions) {
    return null;
  }

  const { isPartOfRestrictedUsers, isLeaderOfAnyRestrictedTeams } =
    restrictions;

  const { isAdmin } = isAdminQuery;

  const isEditDisabled =
    disableOwnershipChange ||
    isInherited ||
    (!isAdmin && !isPartOfRestrictedUsers && !isLeaderOfAnyRestrictedTeams);

  return (
    <TableContainer>
      <TableTitle label="Access control" icon={Eye} />
      <AccessControlPanelDetails
        resourceType={resourceType}
        resourceControl={resourceControl}
        isAuthorisedToFetchUsers={isAdmin || isTeamLeader}
      />

      {!isEditDisabled && !isEditMode && (
        <div className="row">
          <div>
            <Button
              color="link"
              onClick={toggleEditMode}
              data-cy="change-ownership-button"
            >
              <Icon icon={Edit} className="space-right" />
              Change ownership
            </Button>
          </div>
        </div>
      )}

      {isEditMode && (
        <AccessControlPanelForm
          resourceControl={resourceControl}
          onCancelClick={() => toggleEditMode()}
          resourceId={resourceId}
          resourceType={resourceType}
          environmentId={environmentId}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}
    </TableContainer>
  );

  async function handleUpdateSuccess() {
    await onUpdateSuccess();
    toggleEditMode();
  }

  function checkIfInherited() {
    if (!resourceControl) {
      return false;
    }

    const inheritedVolume =
      resourceControl.Type === ResourceControlType.Container &&
      resourceType === ResourceControlType.Volume;
    const inheritedContainer =
      resourceControl.Type === ResourceControlType.Service &&
      resourceType === ResourceControlType.Container;
    const inheritedFromStack =
      resourceControl.Type === ResourceControlType.Stack &&
      resourceType !== ResourceControlType.Stack;

    return inheritedVolume || inheritedContainer || inheritedFromStack;
  }
}

function useRestrictions(resourceControl?: ResourceControlViewModel) {
  const { user } = useCurrentUser();
  const isAdminQuery = useIsEdgeAdmin();
  const memberships = useUserMembership(user.Id);

  if (isAdminQuery.isLoading) {
    return undefined;
  }

  const { isAdmin } = isAdminQuery;

  if (!resourceControl || isAdmin) {
    return {
      isPartOfRestrictedUsers: false,
      isLeaderOfAnyRestrictedTeams: false,
    };
  }

  if (resourceControl.UserAccesses.some((ua) => ua.UserId === user.Id)) {
    return {
      isPartOfRestrictedUsers: true,
      isLeaderOfAnyRestrictedTeams: false,
    };
  }

  const isTeamLeader =
    memberships.isSuccess &&
    isLeaderOfAnyRestrictedTeams(memberships.data, resourceControl);

  return {
    isPartOfRestrictedUsers: false,
    isLeaderOfAnyRestrictedTeams: isTeamLeader,
  };
}

// returns true if user is a team leader and resource is limited to this team
function isLeaderOfAnyRestrictedTeams(
  userMemberships: TeamMembership[],
  resourceControl: ResourceControlViewModel
) {
  return userMemberships.some(
    (membership) =>
      membership.Role === TeamRole.Leader &&
      resourceControl.TeamAccesses.some((ta) => ta.TeamId === membership.TeamID)
  );
}
