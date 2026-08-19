import { object, string, array, number } from 'yup';

import { Team } from '@/react/portainer/users/teams/types';

export function validationSchema(teams: Team[]) {
  return object().shape({
    name: string()
      .required('This field is required.')
      .test(
        'is-unique',
        'This team already exists.',
        (name) => !!name && teams.every((team) => team.Name !== name)
      ),
    leaders: array().of(number()),
  });
}
