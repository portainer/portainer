import { array, object, string } from 'yup';

export function validationSchema() {
  return array(
    object().shape({
      host: string().required('host is required'),
      container: string().required('container is required'),
      protocol: string().oneOf(['TCP', 'UDP']),
    })
  ).min(1, 'At least one port binding is required');
}
