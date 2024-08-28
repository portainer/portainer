import { boolean, object, SchemaOf, string } from 'yup';

import { metadataValidation } from '../../../../common/MetadataFieldset/validation';
import { useNameValidation } from '../../../../common/NameField';

import { FormValues } from './types';

export function useValidation(): SchemaOf<FormValues> {
  return object({
    name: useNameValidation(),
    meta: metadataValidation(),
    overridePath: boolean().default(false),
    socketPath: string()
      .default('')
      .when('overridePath', (overridePath, schema) =>
        overridePath
          ? schema.required(
              'Socket Path is required when override path is enabled'
            )
          : schema
      ),
  });
}
