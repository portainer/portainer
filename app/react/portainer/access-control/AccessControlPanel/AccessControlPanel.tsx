import { useReducer } from 'react';

import { useUser } from '@/portainer/hooks/useUser';
import { Icon } from '@/react/components/Icon';
import { TeamMembership, TeamRole } from '@/react/portainer/users/teams/types';
import { useUserMembership } from '@/portainer/users/queries';
import { EnvironmentId } from '@/react/portainer/environments/types';

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
  const { isAdmin } = useUser();

  const isInherited = checkIfInherited();

  const { isPartOfRestrictedUsers, isLeaderOfAnyRestrictedTeams } =
    useRestrictions(resourceControl);

  const isEditDisabled =
    disableOwnershipChange ||
    isInherited ||
    (!isAdmin && !isPartOfRestrictedUsers && !isLeaderOfAnyRestrictedTeams);

  return (
    <div className="row">
      <div className="col-sm-12">
        <TableContainer>
          <TableTitle label="Access control" icon="eye" featherIcon />
          <AccessControlPanelDetails
            resourceType={resourceType}
            resourceControl={resourceControl}
          />

          {!isEditDisabled && !isEditMode && (
            <div className="row">
              <div>
                <Button color="link" onClick={toggleEditMode}>
                  <Icon icon="edit" className="space-right" feather />
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
      </div>
    </div>
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
  const { user, isAdmin } = useUser();

  const memberships = useUserMembership(user.Id);

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
