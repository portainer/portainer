import { PortMap } from 'docker-types/generated/1.41';
import _ from 'lodash';

import { Protocol, Values } from './PortsMappingField';

export type Range = {
  start: number;
  end: number;
};

type StringPortBinding = {
  hostPort: string;
  protocol: Protocol;
  containerPort: number;
};

type NumericPortBinding = {
  hostPort: number;
  protocol: Protocol;
  containerPort: number;
};

type RangePortBinding = {
  hostPort: Range;
  protocol: Protocol;
  containerPort: Range;
};

export function toViewModel(portBindings: PortMap): Values {
  const parsedPorts = parsePorts(portBindings);
  const sortedPorts = sortPorts(parsedPorts);

  return [
    ...sortedPorts.rangePorts.map((port) => ({
      ...port,
      containerPort: String(port.containerPort),
    })),
    ...combinePorts(sortedPorts.nonRangePorts),
  ];

  function isProtocol(value: string): value is Protocol {
    return value === 'tcp' || value === 'udp';
  }

  function parsePorts(
    portBindings: PortMap
  ): Array<StringPortBinding | NumericPortBinding> {
    return Object.entries(portBindings).flatMap(([key, bindings]) => {
      const [containerPort, protocol] = key.split('/');

      if (!isProtocol(protocol)) {
        throw new Error(`Invalid protocol: ${protocol}`);
      }

      if (!bindings) {
        return [];
      }

      const containerPortNumber = parseInt(containerPort, 10);

      if (Number.isNaN(containerPortNumber)) {
        throw new Error(`Invalid container port: ${containerPort}`);
      }

      return bindings.map((binding) => {
        if (binding.HostPort?.includes('-')) {
          return {
            hostPort: binding.HostPort,
            protocol,
            containerPort: containerPortNumber,
          };
        }
        return {
          hostPort: parseInt(binding.HostPort || '0', 10),
          protocol,
          containerPort: containerPortNumber,
        };
      });
    });
  }

  function sortPorts(ports: Array<StringPortBinding | NumericPortBinding>) {
    const rangePorts = ports.filter(isStringPortBinding);
    const nonRangePorts = ports.filter(isNumericPortBinding);

    return {
      rangePorts,
      nonRangePorts: _.sortBy(nonRangePorts, [
        'containerPort',
        'hostPort',
        'protocol',
      ]),
    };
  }

  function combinePorts(ports: Array<NumericPortBinding>) {
    return ports
      .reduce((acc, port) => {
        const lastPort = acc[acc.length - 1];
        if (
          lastPort &&
          lastPort.containerPort.end === port.containerPort - 1 &&
          lastPort.hostPort.end === port.hostPort - 1 &&
          lastPort.protocol === port.protocol
        ) {
          lastPort.containerPort.end = port.containerPort;
          lastPort.hostPort.end = port.hostPort;
          return acc;
        }

        return [
          ...acc,
          {
            hostPort: {
              start: port.hostPort,
              end: port.hostPort,
            },
            containerPort: {
              start: port.containerPort,
              end: port.containerPort,
            },
            protocol: port.protocol,
          },
        ];
      }, [] as Array<RangePortBinding>)
      .map(({ protocol, containerPort, hostPort }) => ({
        hostPort: getRange(hostPort.start, hostPort.end),
        containerPort: getRange(containerPort.start, containerPort.end),
        protocol,
      }));

    function getRange(start: number, end: number): string {
      if (start === end) {
        if (start === 0) {
          return '';
        }

        return start.toString();
      }

      return `${start}-${end}`;
    }
  }
}

function isNumericPortBinding(
  port: StringPortBinding | NumericPortBinding
): port is NumericPortBinding {
  return port.hostPort !== 'string';
}

function isStringPortBinding(
  port: StringPortBinding | NumericPortBinding
): port is StringPortBinding {
  return port.hostPort === 'string';
}
