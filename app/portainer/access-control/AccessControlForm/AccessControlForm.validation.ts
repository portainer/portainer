import { object, string, array, number } from 'yup';

import { ResourceControlOwnership } from '../types';

export function validationSchema(isAdmin: boolean) {
  return object()
    .shape({
      ownership: string()
        .oneOf(Object.values(ResourceControlOwnership))
        .required(),
      authorizedUsers: array(number()),
      authorizedTeams: array(number()),
    })
    .test(
      'user-and-team',
      isAdmin
        ? 'You must specify at least one team or user.'
        : 'You must specify at least one team.',
      ({ ownership, authorizedTeams, authorizedUsers }) => {
        if (ownership !== ResourceControlOwnership.RESTRICTED) {
          return true;
        }

        if (!isAdmin) {
          return !!authorizedTeams && authorizedTeams.length > 0;
        }

        return (
          !!authorizedTeams &&
          !!authorizedUsers &&
          (authorizedTeams.length > 0 || authorizedUsers.length > 0)
        );
      }
    );
}
