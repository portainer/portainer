import { Team, TeamId } from '@/react/portainer/users/teams/types';

import { Select } from '@@/form-components/ReactSelect';

interface Props {
  name?: string;
  value: TeamId[];
  onChange(value: TeamId[]): void;
  teams: Team[];
  dataCy?: string;
  inputId?: string;
  placeholder?: string;
}

export function TeamsSelector({
  name,
  value,
  onChange,
  teams,
  dataCy,
  inputId,
  placeholder,
}: Props) {
  return (
    <Select
      name={name}
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
