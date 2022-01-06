import { Meta } from '@storybook/react';
import { useState } from 'react';

import { TeamsSelector } from './TeamsSelector';
import { createMockTeam } from './TeamsSelector.mocks';

const meta: Meta = {
  title: 'Components/TeamsSelector',
  component: TeamsSelector,
};

export default meta;
export { Example };

function Example() {
  const [selectedTeams, setSelectedTeams] = useState([1]);

  const teams = [createMockTeam(1, 'team1'), createMockTeam(2, 'team2')];

  return (
    <TeamsSelector
      value={selectedTeams}
      onChange={setSelectedTeams}
      teams={teams}
      placeholder="Select one or more teams"
    />
  );
}
