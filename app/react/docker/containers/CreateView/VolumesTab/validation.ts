import { object, SchemaOf, array, string, mixed } from 'yup';

import { Values, VolumeType, volumeTypes } from './types';

export function validation(): SchemaOf<Values> {
  return array(
    object({
      containerPath: string().required('Container path is required'),
      type: mixed<VolumeType>()
        .oneOf([...volumeTypes])
        .default('volume'),
      name: string().required('Volume name is required'),
      readOnly: mixed<boolean>().default(false),
    })
  ).default([]);
}
