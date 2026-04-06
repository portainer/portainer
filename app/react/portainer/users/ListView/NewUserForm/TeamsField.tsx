import { useField } from 'formik';
import { useTranslation } from 'react-i18next';

import { Link } from '@@/Link';
import { TeamsSelector } from '@@/TeamsSelector';
import { FormControl } from '@@/form-components/FormControl';

import { Team } from '../../teams/types';

import { FormValues } from './FormValues';

export function TeamsField({
  teams,
  disabled,
}: {
  teams: Array<Team>;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const [{ name, value }, { error }, { setValue }] =
    useField<FormValues['teams']>('teams');

  return (
    <FormControl label={t('users.add_to_teams')} inputId="teams-field" errors={error}>
      {teams.length > 0 ? (
        <TeamsSelector
          dataCy="user-teamSelect"
          onChange={(value) => setValue(value)}
          value={value}
          name={name}
          teams={teams}
          inputId="teams-field"
          disabled={disabled}
        />
      ) : (
        <span className="small text-muted">
          {t('users.no_teams_message')}
        </span>
      )}
    </FormControl>
  );
}
