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
        otherwise: port().typeError(
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

function port() {
  return number()
    .optional()
    .min(0, 'Port must be a number between 0 to 65535')
    .max(65535, 'Port must be a number between 0 to 65535');
}

function rangeOrNumber() {
  return lazy<SchemaOf<Range> | NumberSchema>(
    (value: Range | number | undefined) => (isRange(value) ? range() : port())
  );
}

function range(): SchemaOf<Range> {
  return object({
    start: port().required(),
    end: port().required(),
  }).test({
    message: 'Start port must be less than end port',
    test: (value) => !value.start || !value.end || value.start <= value.end,
  });
}
