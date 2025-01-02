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

type RangePortBinding = {
  hostIp: string;
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

  function parsePorts(portBindings: PortMap): Array<StringPortBinding> {
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
        let port = '';
        if (binding.HostPort) {
          port = binding.HostPort;
        }
        if (binding.HostIp) {
          port = `${binding.HostIp}:${port}`;
        }

        if (binding.HostPort?.includes('-')) {
          // Range port
          return {
            hostPort: port,
            protocol,
            containerPort: containerPortNumber,
          };
        }
        return {
          hostPort: port,
          protocol,
          containerPort: containerPortNumber,
        };
      });
    });
  }

  function sortPorts(ports: Array<StringPortBinding>) {
    const rangePorts = ports.filter(isRangePortBinding);
    const nonRangePorts = ports.filter((port) => !isRangePortBinding(port));

    return {
      rangePorts,
      nonRangePorts: _.sortBy(nonRangePorts, [
        'containerPort',
        'hostPort',
        'protocol',
      ]),
    };
  }

  function combinePorts(ports: Array<StringPortBinding>) {
    return ports
      .reduce((acc, port) => {
        let hostIp = '';
        let hostPort = 0;
        if (port.hostPort.includes(':')) {
          const [ipStr, portStr] = port.hostPort.split(':');
          hostIp = ipStr;
          hostPort = parseInt(portStr || '0', 10);
        } else {
          hostPort = parseInt(port.hostPort || '0', 10);
        }

        const lastPort = acc[acc.length - 1];
        if (
          lastPort &&
          lastPort.hostIp === hostIp &&
          lastPort.containerPort.end === port.containerPort - 1 &&
          lastPort.hostPort.end === hostPort - 1 &&
          lastPort.protocol === port.protocol
        ) {
          lastPort.hostIp = hostIp;
          lastPort.containerPort.end = port.containerPort;
          lastPort.hostPort.end = hostPort;
          return acc;
        }

        return [
          ...acc,
          {
            hostIp,
            hostPort: {
              start: hostPort,
              end: hostPort,
            },
            containerPort: {
              start: port.containerPort,
              end: port.containerPort,
            },
            protocol: port.protocol,
          },
        ];
      }, [] as Array<RangePortBinding>)
      .map(({ protocol, containerPort, hostPort, hostIp }) => ({
        hostPort: getRange(hostPort.start, hostPort.end, hostIp),
        containerPort: getRange(containerPort.start, containerPort.end),
        protocol,
      }));

    function getRange(start: number, end: number, hostIp?: string): string {
      if (start === end) {
        if (start === 0) {
          return '';
        }

        if (hostIp) {
          return `${hostIp}:${start}`;
        }
        return start.toString();
      }

      if (hostIp) {
        return `${hostIp}:${start}-${end}`;
      }
      return `${start}-${end}`;
    }
  }
}

function isRangePortBinding(port: StringPortBinding): boolean {
  return port.hostPort.includes('-');
}
