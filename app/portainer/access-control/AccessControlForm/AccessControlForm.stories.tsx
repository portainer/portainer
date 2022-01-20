import { Meta, Story } from '@storybook/react';
import { useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import { UserContext } from '@/portainer/hooks/useUser';
import { UserViewModel } from '@/portainer/models/user';

import { parseAccessControlFormData } from '../utils';

import { AccessControlForm } from './AccessControlForm';

const meta: Meta = {
  title: 'Components/AccessControlForm',
  component: AccessControlForm,
};

export default meta;

enum Role {
  Admin = 1,
  User,
}

const testQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

interface Args {
  userRole: Role;
}

function Template({ userRole }: Args) {
  const isAdmin = userRole === Role.Admin;
  const defaults = parseAccessControlFormData(isAdmin);

  const [value, setValue] = useState(defaults);

  const userProviderState = useMemo(
    () => ({ user: new UserViewModel({ Role: userRole }) }),
    [userRole]
  );

  return (
    <QueryClientProvider client={testQueryClient}>
      <UserContext.Provider value={userProviderState}>
        <AccessControlForm values={value} onChange={setValue} errors={{}} />
      </UserContext.Provider>
    </QueryClientProvider>
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
