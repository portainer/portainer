import {
  array,
  lazy,
  mixed,
  number,
  NumberSchema,
  object,
  SchemaOf,
} from 'yup';

import { Range, isRange } from './types';

export function validation() {
  return array(
    object({
      hostPort: rangeOrNumber(),
      containerPort: mixed().when('hostPort', {
        is: (hostPort: Range | number | undefined) => isRange(hostPort),
        then: rangeOrNumber(),
        otherwise: number(),
      }),
      protocol: mixed().oneOf(['tcp', 'udp']),
      publishMode: mixed().oneOf(['ingress', 'host']),
    })
  );
}

function rangeOrNumber() {
  return lazy<SchemaOf<Range> | NumberSchema>((value) =>
    isRange(value) ? range() : number()
  );
}

function range(): SchemaOf<Range> {
  return object({
    start: number().required(),
    end: number().required(),
  });
}
