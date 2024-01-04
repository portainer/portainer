import { SchemaOf, array, object, number, string } from 'yup';

import { Registry } from '@/react/portainer/registries/types';

export const registriesValidationSchema: SchemaOf<Registry[]> = array(
  object({
    Id: number().required('Registry ID is required.'),
    Name: string().required('Registry name is required.'),
  })
);
