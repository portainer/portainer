import { Meta } from '@storybook/react';
import { useMemo, useState } from 'react';

import { UserContext } from '@/portainer/hooks/useUser';
import { createMockUsers } from '@/react-tools/test-mocks';
import { UserViewModel } from '@/portainer/models/user';
import { Role } from '@/portainer/users/types';
import { TeamRole } from '@/react/portainer/users/teams/types';

import { TeamMembersList } from './TeamMembersList';

const meta: Meta = {
  title: 'Teams/TeamAssociationSelector/TeamMembersList',
  component: TeamMembersList,
};

export default meta;

export { Example };

interface Args {
  userRole: Role;
}

function Example({ userRole }: Args) {
  const userProviderState = useMemo(
    () => ({ user: new UserViewModel({ Role: userRole }) }),
    [userRole]
  );

  const [users] = useState(createMockUsers(20));
  const [roles] = useState(
    Object.fromEntries(
      users.map((user) => [
        user.Id,
        Math.random() > 0.5 ? TeamRole.Leader : TeamRole.Member,
      ])
    )
  );

  return (
    <UserContext.Provider value={userProviderState}>
      <TeamMembersList users={users} roles={roles} teamId={3} />
    </UserContext.Provider>
  );
}

Example.args = {
  userRole: Role.Admin,
};
