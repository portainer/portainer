import { object, string, SchemaOf } from 'yup';

import { tlsConfigValidation } from '@/react/components/TLSFieldset/TLSFieldset';
import {
  EnvironmentId,
  EnvironmentStatus,
} from '@/react/portainer/environments/types';

import { useNameValidation } from '../../common/NameField/NameField';
import { metadataValidation } from '../../common/MetadataFieldset/validation';

import { GeneralEnvironmentFormValues } from './types';

export function useGeneralValidation({
  status,
  environmentId,
}: {
  status: EnvironmentStatus;
  environmentId: EnvironmentId;
}): SchemaOf<GeneralEnvironmentFormValues> {
  const nameValidation = useNameValidation(environmentId);

  return object({
    name: nameValidation,
    environmentUrl:
      status !== EnvironmentStatus.Error
        ? string().required('Environment address is required')
        : string().default(''),
    publicUrl: string().default(''),
    tls: tlsConfigValidation({ optionalCert: true }).optional(),
    meta: metadataValidation(),
  });
}
