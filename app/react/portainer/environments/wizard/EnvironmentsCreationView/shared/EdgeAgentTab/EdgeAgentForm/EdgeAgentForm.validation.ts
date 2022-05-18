import { number, object, SchemaOf, string } from 'yup';

import { metadataValidation } from '../../MetadataFieldset/validation';

import { validation as urlValidation } from './PortainerUrlField';
import { FormValues } from './types';

export function validationSchema(): SchemaOf<FormValues> {
  return object().shape({
    name: string().required('Name is required'),
    portainerUrl: urlValidation(),
    pollFrequency: number().required(),
    meta: metadataValidation(),
  });
}
