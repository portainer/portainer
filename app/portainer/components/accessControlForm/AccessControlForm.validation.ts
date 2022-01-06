import { object, string, array, number, bool } from 'yup';

import { ResourceControlOwnership } from '@/portainer/models/resourceControl/resourceControlOwnership';

export function validationSchema(isAdmin: boolean) {
  return object().shape({
    accessControlEnabled: bool(),
    ownership: string()
      .oneOf(Object.values(ResourceControlOwnership))
      .when('accessControlEnabled', {
        is: true,
        then: (schema) => schema.required(),
      }),
    authorizedUsers: array(number()).when(
      ['accessControlEnabled', 'ownership'],
      {
        is: (
          accessControlEnabled: boolean,
          ownership: ResourceControlOwnership
        ) =>
          isAdmin &&
          accessControlEnabled &&
          ownership === ResourceControlOwnership.RESTRICTED,
        then: (schema) =>
          schema.required('You must specify at least one user.'),
      }
    ),
    authorizedTeams: array(number()).when(
      ['accessControlEnabled', 'ownership'],
      {
        is: (
          accessControlEnabled: boolean,
          ownership: ResourceControlOwnership
        ) =>
          accessControlEnabled &&
          ownership === ResourceControlOwnership.RESTRICTED,
        then: (schema) => schema.required('You must specify at least one team'),
      }
    ),
  });
}
