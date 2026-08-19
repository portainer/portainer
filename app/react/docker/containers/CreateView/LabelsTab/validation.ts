import { array, object, SchemaOf, string } from 'yup';

import { Values } from './types';

export function validation(): SchemaOf<Values> {
  return array(
    object({
      name: string().required('Name is required'),
      value: string().default(''),
    })
  );
}
