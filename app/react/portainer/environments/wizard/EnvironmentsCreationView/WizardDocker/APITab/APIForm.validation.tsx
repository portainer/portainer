import { object, SchemaOf, string } from 'yup';

import i18n from '@/i18n';
import { tlsConfigValidation } from '@/react/components/TLSFieldset/TLSFieldset';
import { useNameValidation } from '@/react/portainer/environments/common/NameField/NameField';
import { metadataValidation } from '@/react/portainer/environments/common/MetadataFieldset/validation';

import { FormValues } from './types';

export function useValidation(): SchemaOf<FormValues> {
  return object({
    name: useNameValidation(),
    url: string().required(i18n.t('validation.field_required')),
    tlsConfig: tlsConfigValidation(),
    meta: metadataValidation(),
  });
}
