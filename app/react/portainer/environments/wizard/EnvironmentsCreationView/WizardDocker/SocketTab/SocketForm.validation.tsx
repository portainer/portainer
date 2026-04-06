import { boolean, object, SchemaOf, string } from 'yup';

import i18n from '@/i18n';
import { useNameValidation } from '@/react/portainer/environments/common/NameField/NameField';
import { metadataValidation } from '@/react/portainer/environments/common/MetadataFieldset/validation';

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
              i18n.t('validation.socket_path_required_override')
            )
          : schema
      ),
  });
}
