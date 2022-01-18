import { object, string, array, number } from 'yup';

import { TeamViewModel } from '@/portainer/models/team';

export function validationSchema(teams: TeamViewModel[]) {
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
