import Select from 'react-select';

import { Team, TeamId } from '@/portainer/teams/types';

interface Props {
  value: TeamId[];
  onChange(value: TeamId[]): void;
  teams: Team[];
  dataCy?: string;
  inputId?: string;
  placeholder?: string;
}

export function TeamsSelector({
  value,
  onChange,
  teams,
  dataCy,
  inputId,
  placeholder,
}: Props) {
  return (
    <Select
      isMulti
      getOptionLabel={(team) => team.Name}
      getOptionValue={(team) => String(team.Id)}
      options={teams}
      value={teams.filter((team) => value.includes(team.Id))}
      closeMenuOnSelect={false}
      onChange={(selectedTeams) =>
        onChange(selectedTeams.map((team) => team.Id))
      }
      data-cy={dataCy}
      inputId={inputId}
      placeholder={placeholder}
    />
  );
}
