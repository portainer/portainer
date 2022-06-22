import { boolean, object, SchemaOf, string } from 'yup';

import { metadataValidation } from '../../shared/MetadataFieldset/validation';
import { nameValidation } from '../../shared/NameField';

import { FormValues } from './types';

export function validation(): SchemaOf<FormValues> {
  return object({
    name: nameValidation(),
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
