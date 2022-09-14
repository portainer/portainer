import { Team, TeamId } from '@/react/portainer/users/teams/types';

import { PortainerSelect } from '@@/form-components/PortainerSelect';

interface Props {
  name?: string;
  value: TeamId[] | readonly TeamId[];
  onChange(value: readonly TeamId[]): void;
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

  return (
    <PortainerSelect<number>
      name={name}
      isMulti
      options={options}
      value={value}
      onChange={(value) => onChange(value)}
      data-cy={dataCy}
      inputId={inputId}
      placeholder={placeholder}
    />
  );
}
