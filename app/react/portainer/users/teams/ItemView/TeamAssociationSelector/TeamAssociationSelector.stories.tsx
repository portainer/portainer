import { Meta } from '@storybook/react';
import { useMemo, useState } from 'react';

import { createMockUsers } from '@/react-tools/test-mocks';
import { Role, User } from '@/portainer/users/types';
import { UserViewModel } from '@/portainer/models/user';
import { UserContext } from '@/portainer/hooks/useUser';

import { TeamMembership, TeamRole } from '../../types';

import { TeamAssociationSelector } from './TeamAssociationSelector';

const meta: Meta = {
  title: 'teams/TeamAssociationSelector',
  component: TeamAssociationSelector,
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
  const [users] = useState(createMockUsers(20) as User[]);

  const [memberships] = useState<Omit<TeamMembership, 'Id' | 'TeamID'>[]>(
    users
      .filter(() => Math.random() > 0.5)
      .map((u) => ({
        UserID: u.Id,
        Role: Math.random() > 0.5 ? TeamRole.Leader : TeamRole.Member,
      }))
  );

  return (
    <UserContext.Provider value={userProviderState}>
      <TeamAssociationSelector
        teamId={3}
        users={users}
        memberships={memberships as TeamMembership[]}
      />
    </UserContext.Provider>
  );
}

Example.args = {
  userRole: TeamRole.Leader,
};
