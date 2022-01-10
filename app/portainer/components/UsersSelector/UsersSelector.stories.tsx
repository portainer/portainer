import { Meta } from '@storybook/react';
import { useState } from 'react';

import { UsersSelector } from './UsersSelector';
import { createMockUser } from './UsersSelector.mocks';

const meta: Meta = {
  title: 'Components/UsersSelector',
  component: UsersSelector,
};

export default meta;

export { Example };

function Example() {
  const [selectedUsers, setSelectedUsers] = useState([1]);

  const users = [createMockUser(1, 'user1'), createMockUser(2, 'user2')];

  return (
    <UsersSelector
      value={selectedUsers}
      onChange={setSelectedUsers}
      users={users}
      placeholder="Select one or more users"
    />
  );
}
