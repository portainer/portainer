import { number, object, SchemaOf } from 'yup';

import { gpusListValidation } from '@/react/portainer/environments/wizard/EnvironmentsCreationView/shared/Hardware/GpusList';

import { metadataValidation } from '../../MetadataFieldset/validation';
import { useNameValidation } from '../../NameField';

import { validation as urlValidation } from './PortainerUrlField';
import { FormValues } from './types';

export function useValidationSchema(): SchemaOf<FormValues> {
  const nameValidation = useNameValidation();

  return object().shape({
    name: nameValidation,
    portainerUrl: urlValidation(),
    pollFrequency: number().required(),
    meta: metadataValidation(),
    gpus: gpusListValidation(),
  });
}
