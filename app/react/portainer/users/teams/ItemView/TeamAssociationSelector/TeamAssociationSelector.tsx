import _ from 'lodash';

import { User } from '@/portainer/users/types';

import { TeamMembership } from '../../types';

import { UsersList } from './UsersList';
import { TeamMembersList } from './TeamMembersList';

interface Props {
  users: User[];
  memberships: TeamMembership[];
  disabled?: boolean;
}

export function TeamAssociationSelector({
  users,
  memberships,
  disabled,
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
    <div className="row">
      <div className="col-sm-6">
        <UsersList users={usersNotInTeam} disabled={disabled} />
      </div>
      <div className="col-sm-6">
        <TeamMembersList
          disabled={disabled}
          users={teamUsers}
          roles={userRoles}
        />
      </div>
    </div>
  );
}
