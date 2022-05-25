import { object, SchemaOf, string } from 'yup';

import { CreateAgentEnvironmentValues } from '@/portainer/environments/environment.service/create';

import { metadataValidation } from '../MetadataFieldset/validation';
import { nameValidation } from '../NameField';

export function validation(): SchemaOf<CreateAgentEnvironmentValues> {
  return object({
    name: nameValidation(),
    environmentUrl: string().required('This field is required.'),
    meta: metadataValidation(),
  });
}
