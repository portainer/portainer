import { useTranslation } from 'react-i18next';

import { Team } from '@/react/portainer/users/teams/types';

import { TeamsSelector } from '@@/TeamsSelector';
import { FormControl } from '@@/form-components/FormControl';
import { Link } from '@@/Link';

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
  const { t } = useTranslation();
  return (
    <FormControl
      label={t('access_control.teams_field_label')}
      tooltip={
        teams.length > 0
          ? overrideTooltip ||
            t('access_control.teams_field_tooltip')
          : undefined
      }
      inputId="authorized-teams-selector"
      errors={errors}
    >
      {teams.length > 0 ? (
        <TeamsSelector
          name={name}
          teams={teams}
          onChange={onChange}
          value={value}
          inputId="authorized-teams-selector"
          dataCy="teams-selector"
        />
      ) : (
        <span className="small text-muted">
          {t('access_control.no_teams_prefix')}{' '}
          <Link to="portainer.teams" data-cy="teams-view-link">{t('access_control.no_teams_link')}</Link>{' '}
          {t('access_control.no_teams_suffix')}
        </span>
      )}
    </FormControl>
  );
}
