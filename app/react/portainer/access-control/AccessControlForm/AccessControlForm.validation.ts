import { object, mixed, array, number, SchemaOf } from 'yup';

import { AccessControlFormData, ResourceControlOwnership } from '../types';

export function validationSchema(
  isAdmin: boolean
): SchemaOf<AccessControlFormData> {
  return object()
    .shape({
      ownership: mixed<ResourceControlOwnership>()
        .oneOf(Object.values(ResourceControlOwnership))
        .required(),
      authorizedUsers: array(number().default(0)),
      authorizedTeams: array(number().default(0)),
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
