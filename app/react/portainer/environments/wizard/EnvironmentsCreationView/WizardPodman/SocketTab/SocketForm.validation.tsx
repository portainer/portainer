import { boolean, object, SchemaOf, string } from 'yup';
import { useTranslation } from 'react-i18next';

import { useNameValidation } from '@/react/portainer/environments/common/NameField/NameField';
import { metadataValidation } from '@/react/portainer/environments/common/MetadataFieldset/validation';

import { FormValues } from './types';

export function useValidation(): SchemaOf<FormValues> {
  const { t } = useTranslation();

  return object({
    name: useNameValidation(),
    meta: metadataValidation(),
    overridePath: boolean().default(false),
    socketPath: string()
      .default('')
      .when('overridePath', (overridePath, schema) =>
        overridePath
          ? schema.required(t('wizard_env.podman.socket_path_required'))
          : schema
      ),
  });
}
