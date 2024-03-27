import { SchemaOf, object, string } from 'yup';

import { ApiKeyFormValues } from './types';

export function getAPITokenValidationSchema(
  authenticationEnabled: boolean
): SchemaOf<ApiKeyFormValues> {
  if (authenticationEnabled) {
    return object({
      password: string().required('Password is required.'),
      description: string()
        .max(128, 'Description must be at most 128 characters')
        .required('Description is required.'),
    });
  }

  return object({
    password: string().optional(),
    description: string()
      .max(128, 'Description must be at most 128 characters')
      .required('Description is required.'),
  });
}
