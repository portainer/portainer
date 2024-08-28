import { useField } from 'formik';

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
  const [{ name, value }, { error }, { setValue }] =
    useField<FormValues['teams']>('teams');

  return (
    <FormControl label="Add to team(s)" inputId="teams-field" errors={error}>
      <TeamsSelector
        dataCy="user-teamSelect"
        onChange={(value) => setValue(value)}
        value={value}
        name={name}
        teams={teams}
        inputId="teams-field"
        disabled={disabled}
      />
    </FormControl>
  );
}
