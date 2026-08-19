import { mixed, SchemaOf } from 'yup';

import { RestartPolicy } from './types';

export function validation(): SchemaOf<RestartPolicy> {
  return mixed<RestartPolicy>()
    .oneOf(Object.values(RestartPolicy))
    .default(RestartPolicy.No) as SchemaOf<RestartPolicy>;
}
