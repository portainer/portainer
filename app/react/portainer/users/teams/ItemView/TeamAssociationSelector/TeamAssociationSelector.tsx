import _ from 'lodash';

import { User } from '@/portainer/users/types';

import { TeamId, TeamMembership } from '../../types';

import { UsersList } from './UsersList';
import { TeamMembersList } from './TeamMembersList';

interface Props {
  users: User[];
  memberships: TeamMembership[];
  disabled?: boolean;
  teamId: TeamId;
}

export function TeamAssociationSelector({
  users,
  memberships,
  disabled,
  teamId,
}: Props) {
  const teamUsers = _.compact(
    memberships.map((m) => users.find((user) => user.Id === m.UserID))
  );
  const usersNotInTeam = users.filter(
    (user) => !memberships.some((m) => m.UserID === user.Id)
  );
  const userRoles = Object.fromEntries(
    memberships.map((m) => [m.UserID, m.Role])
  );

  return (
    <div className="flex">
      <div className="w-1/2">
        <UsersList users={usersNotInTeam} disabled={disabled} teamId={teamId} />
      </div>
      <div className="w-1/2">
        <TeamMembersList
          teamId={teamId}
          disabled={disabled}
          users={teamUsers}
          roles={userRoles}
        />
      </div>
    </div>
  );
}
