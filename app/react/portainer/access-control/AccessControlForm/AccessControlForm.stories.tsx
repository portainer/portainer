import { Meta, Story } from '@storybook/react';
import { useState } from 'react';

import { UserViewModel } from '@/portainer/models/user';
import { Role, User } from '@/portainer/users/types';
import { isPureAdmin } from '@/portainer/users/user.helpers';
import { withUserProvider } from '@/react/test-utils/withUserProvider';

import { parseAccessControlFormData } from '../utils';

import { AccessControlForm } from './AccessControlForm';

const meta: Meta = {
  title: 'Components/AccessControlForm',
  component: AccessControlForm,
};

export default meta;

interface Args {
  userRole: Role;
}

function Template({ userRole }: Args) {
  const defaults = parseAccessControlFormData(
    isPureAdmin({ Role: userRole } as User),
    0
  );

  const [value, setValue] = useState(defaults);

  const Wrapped = withUserProvider(
    AccessControlForm,
    new UserViewModel({ Role: userRole })
  );

  return (
    <Wrapped values={value} onChange={setValue} errors={{}} environmentId={1} />
  );
}

export const AdminAccessControl: Story<Args> = Template.bind({});
AdminAccessControl.args = {
  userRole: Role.Admin,
};

export const NonAdminAccessControl: Story<Args> = Template.bind({});
NonAdminAccessControl.args = {
  userRole: Role.Standard,
};
