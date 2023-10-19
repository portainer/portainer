import { array, mixed, object, SchemaOf, string } from 'yup';

import { Values } from './PortsMappingField';

export function validationSchema(): SchemaOf<Values> {
  return array(
    object({
      hostPort: string().required('host is required'),
      containerPort: string().required('container is required'),
      protocol: mixed().oneOf(['tcp', 'udp']),
    })
  );
}
