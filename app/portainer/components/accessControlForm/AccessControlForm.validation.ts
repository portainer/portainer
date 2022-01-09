import { object, string, array, number, bool } from 'yup';

import { ResourceControlOwnership } from '@/portainer/models/resourceControl/resourceControlOwnership';

export function validationSchema(isAdmin: boolean) {
  return object()
    .shape({
      accessControlEnabled: bool(),
      ownership: string()
        .oneOf(Object.values(ResourceControlOwnership))
        .when('accessControlEnabled', {
          is: true,
          then: (schema) => schema.required(),
        }),
      authorizedUsers: array(number()),
      authorizedTeams: array(number()),
    })
    .test(
      'user-and-team',
      isAdmin
        ? 'You must specify at least one team or user.'
        : 'You must specify at least one team.',
      ({
        accessControlEnabled,
        ownership,
        authorizedTeams,
        authorizedUsers,
      }) => {
        if (
          !accessControlEnabled ||
          ownership !== ResourceControlOwnership.RESTRICTED
        ) {
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
