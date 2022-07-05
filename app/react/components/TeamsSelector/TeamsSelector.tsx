import { Team, TeamId } from '@/react/portainer/users/teams/types';

import { Select } from '@@/form-components/PortainerSelect';

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
  const options = teams.map((team) => ({ label: team.Name, value: team.Id }));

  const values = options.filter((option) => value.includes(option.value));
  return (
    <Select<number>
      name={name}
      isMulti
      options={options}
      value={values}
      onChange={(value) => onChange(value.map((team) => team.value))}
      data-cy={dataCy}
      inputId={inputId}
      placeholder={placeholder}
    />
  );
}
