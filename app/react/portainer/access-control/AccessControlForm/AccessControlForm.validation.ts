import { object, mixed, array, number, SchemaOf } from 'yup';

import i18n from '@/i18n';

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
        ? i18n.t('validation.must_specify_team_or_user')
        : i18n.t('validation.must_specify_team'),
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
