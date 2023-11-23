import { SchemaOf, array, object, number, string } from 'yup';

import { Registry } from '@/react/portainer/registries/types/registry';

export const registriesValidationSchema: SchemaOf<Registry[]> = array(
  object({
    Id: number().required('Registry ID is required.'),
    Name: string().required('Registry name is required.'),
  }) as unknown as SchemaOf<Registry>
  // the only needed value is actually the id. SchemaOf throw a ts error if we don't cast to SchemaOf<Registry>
);
