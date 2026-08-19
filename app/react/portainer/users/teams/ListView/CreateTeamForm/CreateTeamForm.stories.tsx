import { Meta } from '@storybook/react-webpack5';

import { CreateTeamForm } from './CreateTeamForm';
import { mockExampleData } from './CreateTeamForm.mocks';

const meta: Meta = {
  title: 'Components/Teams/CreateTeamForm',
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
