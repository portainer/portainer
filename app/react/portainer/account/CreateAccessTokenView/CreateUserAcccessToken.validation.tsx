import { SchemaOf, object, string } from 'yup';

import { ApiKeyFormValues } from './types';

export function getAPITokenValidationSchema(): SchemaOf<ApiKeyFormValues> {
  return object({
    password: string().required('Password is required.'),
    description: string().required('Description is required'),
  });
}
