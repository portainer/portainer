import { SchemaOf, object, string } from 'yup';

import { ApiKeyFormValues } from './types';

export function getAPITokenValidationSchema(): SchemaOf<ApiKeyFormValues> {
  return object({
    password: string().required('Password is required.'),
    description: string()
      .max(128, 'Description must be at most 128 characters')
      .required('Description is required'),
  });
}
