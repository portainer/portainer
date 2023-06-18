import { SchemaOf, object, string, boolean } from 'yup';

import { BackupFileSettings } from './types';

export function validationSchema(): SchemaOf<BackupFileSettings> {
  return object({
    passwordProtect: boolean().default(false),
    password: string()
      .default('')
      .when('passwordProtect', {
        is: true,
        then: (schema) => schema.required('This field is required.'),
      }),
  });
}
