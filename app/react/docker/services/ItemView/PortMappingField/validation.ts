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
        is: (hostPort: Range | number | undefined) =>
          !hostPort || isRange(hostPort),
        then: rangeOrNumber(),
        otherwise: number().typeError(
          'Container port must be a number when host port is not a range'
        ),
      }),
      protocol: mixed().oneOf(['tcp', 'udp']),
      publishMode: mixed().oneOf(['ingress', 'host']),
    }).test({
      message:
        'Invalid port specification: host port range must be equal to container port range',
      test: (portBinding) => {
        const hostPort = portBinding.hostPort as Range | number | undefined;
        return !(
          isRange(hostPort) &&
          isRange(portBinding.containerPort) &&
          hostPort.end - hostPort.start !==
            portBinding.containerPort.end - portBinding.containerPort.start
        );
      },
    })
  );
}

function rangeOrNumber() {
  return lazy<SchemaOf<Range> | NumberSchema>(
    (value: Range | number | undefined) => (isRange(value) ? range() : number())
  );
}

function range(): SchemaOf<Range> {
  return object({
    start: number().required(),
    end: number().required(),
  });
}
