import { Meta, Story } from '@storybook/react';
import { useMemo, useState } from 'react';

import { UserContext } from '@/portainer/hooks/useUser';
import { ResourceControlOwnership } from '@/portainer/models/resourceControl/resourceControlOwnership';
import { UserViewModel } from '@/portainer/models/user';

import { AccessControlForm } from './AccessControlForm';
import { createMockTeams, createMockUsers } from './AccessControlForm.mocks';
import { AccessControlFormData } from './model';

const meta: Meta = {
  title: 'Components/AccessControlForm',
  component: AccessControlForm,
};

export default meta;

enum Role {
  Admin = 1,
  User,
}

const teams = createMockTeams(3);
const users = createMockUsers(3);

interface Args {
  userRole: Role;
}

function Template({ userRole }: Args) {
  const defaults = new AccessControlFormData();
  defaults.ownership =
    userRole === Role.Admin
      ? ResourceControlOwnership.ADMINISTRATORS
      : ResourceControlOwnership.PRIVATE;

  const [value, setValue] = useState(defaults);

  const userProviderState = useMemo(
    () => ({ user: new UserViewModel({ Role: userRole }) }),
    [userRole]
  );

  return (
    <UserContext.Provider value={userProviderState}>
      <AccessControlForm
        values={value}
        onChange={setValue}
        teams={teams}
        users={users}
      />
    </UserContext.Provider>
  );
}

export const AdminAccessControl: Story<Args> = Template.bind({});
AdminAccessControl.args = {
  userRole: Role.Admin,
};

export const NonAdminAccessControl: Story<Args> = Template.bind({});
NonAdminAccessControl.args = {
  userRole: Role.User,
};
