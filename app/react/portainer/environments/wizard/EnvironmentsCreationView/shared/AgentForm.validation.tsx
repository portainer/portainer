import { object, SchemaOf, string } from 'yup';

import { CreateAgentEnvironmentValues } from '@/portainer/environments/environment.service/create';

import { metadataValidation } from './MetadataFieldset/validation';

export function validation(): SchemaOf<CreateAgentEnvironmentValues> {
  return object({
    name: string().required('This field is required.'),
    environmentUrl: string().required('This field is required.'),
    meta: metadataValidation(),
  });
}
