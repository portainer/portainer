import { array, mixed, object, SchemaOf, string } from 'yup';

import { Values } from './PortsMappingField';

export function validationSchema(): SchemaOf<Values> {
  return array(
    object({
      hostPort: string().default(''),
      containerPort: string().required('container is required'),
      protocol: mixed().oneOf(['tcp', 'udp']),
    })
  );
}
