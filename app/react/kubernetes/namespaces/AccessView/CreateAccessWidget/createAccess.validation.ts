import { object, array, string, number, SchemaOf, mixed } from 'yup';

import { CreateAccessValues } from './types';

export function validationSchema(): SchemaOf<CreateAccessValues> {
  return object().shape({
    selectedUsersAndTeams: array(
      object().shape({
        type: mixed().oneOf(['team', 'user']).required(),
        name: string().required(),
        id: number().required(),
        role: object().shape({
          id: number().required(),
          name: string().required(),
        }),
      })
    ).min(1),
  });
}
