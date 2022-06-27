import { Meta } from '@storybook/react';

import { CreateTeamForm } from './CreateTeamForm';
import { mockExampleData } from './CreateTeamForm.mocks';

const meta: Meta = {
  title: 'teams/CreateTeamForm',
  component: CreateTeamForm,
};

export default meta;

export { Example };

function Example() {
  const { teams, users } = mockExampleData();

  return (
    <div>
      <CreateTeamForm users={users} teams={teams} />
    </div>
  );
}
