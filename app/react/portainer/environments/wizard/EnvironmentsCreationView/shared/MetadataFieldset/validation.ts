import { object, number, array, SchemaOf } from 'yup';

import { EnvironmentMetadata } from '@/react/portainer/environments/environment.service/create';

export function metadataValidation(): SchemaOf<EnvironmentMetadata> {
  return object({
    groupId: number(),
    tagIds: array().of(number()).default([]),
  });
}
