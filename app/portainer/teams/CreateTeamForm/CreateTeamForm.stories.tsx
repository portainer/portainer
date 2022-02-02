import { Meta } from '@storybook/react';
import { useState } from 'react';

import { CreateTeamForm, FormValues } from './CreateTeamForm';
import { mockExampleData } from './CreateTeamForm.mocks';

const meta: Meta = {
  title: 'teams/CreateTeamForm',
  component: CreateTeamForm,
};

export default meta;

export { Example };

function Example() {
  const [message, setMessage] = useState('');
  const { teams, users } = mockExampleData();

  return (
    <div>
      <CreateTeamForm users={users} teams={teams} onSubmit={handleSubmit} />
      <div>{message}</div>
    </div>
  );

  function handleSubmit(values: FormValues) {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setMessage(
          `created team ${values.name} with ${values.leaders.length} leaders`
        );
        resolve();
      }, 3000);
    });
  }
}
