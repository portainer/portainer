import { TeamsSelector } from '@/portainer/components/TeamsSelector';
import { FormControl } from '@/portainer/components/form-components/FormControl';
import { Link } from '@/portainer/components/Link';
import { Team } from '@/portainer/teams/types';

interface Props {
  name: string;
  teams: Team[];
  value: number[];
  overrideTooltip?: string;
  onChange(value: number[]): void;
  errors?: string | string[];
}

export function TeamsField({
  name,
  teams,
  value,
  overrideTooltip,
  onChange,
  errors,
}: Props) {
  return (
    <FormControl
      label="Authorized teams"
      tooltip={
        teams.length > 0
          ? overrideTooltip ||
            'You can select which team(s) will be able to manage this resource.'
          : undefined
      }
      inputId="teams-selector"
      errors={errors}
    >
      {teams.length > 0 ? (
        <TeamsSelector
          name={name}
          teams={teams}
          onChange={onChange}
          value={value}
          inputId="teams-selector"
        />
      ) : (
        <span className="small text-muted">
          You have not yet created any teams. Head over to the
          <Link to="portainer.teams">Teams view</Link> to manage teams.
        </span>
      )}
    </FormControl>
  );
}
