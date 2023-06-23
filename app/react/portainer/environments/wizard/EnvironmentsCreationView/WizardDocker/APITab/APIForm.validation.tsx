import { object, SchemaOf, string } from 'yup';

import { tlsConfigValidation } from '@/react/components/TLSFieldset/TLSFieldset';

import { metadataValidation } from '../../shared/MetadataFieldset/validation';
import { useNameValidation } from '../../shared/NameField';

import { FormValues } from './types';

export function useValidation(): SchemaOf<FormValues> {
  return object({
    name: useNameValidation(),
    url: string().required('This field is required.'),
    tlsConfig: tlsConfigValidation(),
    meta: metadataValidation(),
  });
}
