import { object, SchemaOf, string } from 'yup';

import { useNameValidation } from '@/react/portainer/environments/common/NameField/NameField';

import { EnvironmentId } from '../../types';
import { metadataValidation } from '../../common/MetadataFieldset/validation';

import { AzureEnvironmentFormValues } from './types';

export function useAzureValidation({
  environmentId,
}: {
  environmentId: EnvironmentId;
}): SchemaOf<AzureEnvironmentFormValues> {
  return object({
    name: useNameValidation(environmentId),
    environmentUrl: string().default(''),
    azure: object({
      applicationId: string().default(''),
      tenantId: string().default(''),
      authenticationKey: string().default(''),
    }).required(),
    meta: metadataValidation(),
  });
}
