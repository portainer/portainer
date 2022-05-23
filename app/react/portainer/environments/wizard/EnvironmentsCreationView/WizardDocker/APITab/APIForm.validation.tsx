import { boolean, object, SchemaOf, string } from 'yup';

import { metadataValidation } from '../../shared/MetadataFieldset/validation';
import { nameValidation } from '../../shared/NameField';

import { validation as certsValidation } from './TLSFieldset';
import { FormValues } from './types';

export function validation(): SchemaOf<FormValues> {
  return object({
    name: nameValidation(),
    url: string().required('This field is required.'),
    tls: boolean().default(false),
    skipVerify: boolean(),
    meta: metadataValidation(),
    ...certsValidation(),
  });
}
