import { object, string, array, number } from 'yup';

import i18n from '@/i18n';
import { Team } from '@/react/portainer/users/teams/types';

export function validationSchema(teams: Team[]) {
  return object().shape({
    name: string()
      .required(i18n.t('validation.field_required'))
      .test(
        'is-unique',
        i18n.t('validation.team_already_exists'),
        (name) => !!name && teams.every((team) => team.Name !== name)
      ),
    leaders: array().of(number()),
  });
}
