import { array, bool, mixed, number, object, SchemaOf, string } from 'yup';

import { ResourceControlOwnership } from '@/react/portainer/access-control/types';
import { stringEnumValues } from '@/types';

import { isValidUrl } from '@@/form-components/validate-url';

import { FormValues, FormValueTypes } from './type';

export function validationSchema(): SchemaOf<FormValues> {
  return object({
    name: string().required('Name is required.'),
    type: mixed<FormValues['type']>()
      .oneOf([...FormValueTypes])
      .required()
      .default('git'),
    git: validateGit(),
    ownership: mixed<ResourceControlOwnership>()
      .oneOf(stringEnumValues(ResourceControlOwnership))
      .required(),
    authorizedTeams: array().of(number().required()),
    authorizedUsers: array().of(number().required()),
  });
}

export function validateGitConnection() {
  return validateGit().pick(['url', 'authentication', 'tlsSkipVerify']);
}

function validateGit(): SchemaOf<FormValues['git']> {
  return object({
    authentication: object({
      authEnabled: bool().required().default(false),
      username: string().when('authEnabled', {
        is: true,
        then: string().required('Username is required'),
      }),
      password: string().when('authEnabled', {
        is: true,
        then: string().required('Password is required'),
      }),
    }),
    url: string()
      .required('Repository URL is required.')
      .test(
        'valid repository URL',
        'The repository URL must be a valid URL (localhost cannot be used)',
        (value) =>
          isValidUrl(
            value,
            (url) => !!url.hostname && url.hostname !== 'localhost'
          )
      ),
    tlsSkipVerify: bool(),
    connectionOk: bool()
      .oneOf([true], 'The connection test must succeed before continuing.')
      .required(),
  });
}
