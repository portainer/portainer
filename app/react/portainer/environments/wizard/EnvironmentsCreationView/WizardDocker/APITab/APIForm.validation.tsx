import { boolean, object, SchemaOf, string } from 'yup';

import { metadataValidation } from '../../shared/MetadataFieldset/validation';

import { validation as certsValidation } from './TLSFieldset';
import { FormValues } from './types';

export function validation(): SchemaOf<FormValues> {
  return object({
    name: string().required('This field is required.'),
    url: string().required('This field is required.'),
    tls: boolean().default(false),
    skipVerify: boolean(),
    meta: metadataValidation(),
    ...certsValidation(),
  });
}
