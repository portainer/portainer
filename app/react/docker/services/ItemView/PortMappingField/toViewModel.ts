import { EndpointPortConfig } from 'docker-types/generated/1.41';
import _ from 'lodash';

import { PortBinding, Protocol, Value, isProtocol, isRange } from './types';

// if container is number then host is number | undefined
export function toViewModel(
  portBindings: Array<EndpointPortConfig> | undefined = []
): Array<Value> {
  const parsedPorts = parsePorts(portBindings);
  const sortedPorts = sortPorts(parsedPorts);

  return combinePorts(sortedPorts);

  function parsePorts(portBindings: Array<EndpointPortConfig>) {
    return portBindings.map((binding) => ({
      hostPort: binding.PublishedPort,
      protocol: isProtocol(binding.Protocol) ? binding.Protocol : 'tcp',
      containerPort: binding.TargetPort,
      publishMode: binding.PublishMode || 'ingress',
    }));
  }

  function sortPorts(
    ports: Array<{
      hostPort: number | undefined;
      protocol: Protocol;
      containerPort: number | undefined;
      publishMode: 'ingress' | 'host';
    }>
  ) {
    return _.sortBy(ports, [
      'containerPort',
      'hostPort',
      'protocol',
      'publishMode',
    ]);
  }

  function combinePorts(
    ports: Array<PortBinding<number | undefined, number | undefined>>
  ): Array<Value> {
    return ports.reduce((acc, port) => {
      const lastPort = acc[acc.length - 1];

      if (
        !lastPort ||
        lastPort.publishMode !== port.publishMode ||
        lastPort.protocol !== port.protocol
      ) {
        return [...acc, port] satisfies Array<Value>;
      }

      if (
        typeof lastPort.hostPort === 'undefined' &&
        typeof port.hostPort === 'undefined'
      ) {
        if (isRange(lastPort.containerPort)) {
          if (lastPort.containerPort.end === port.containerPort) {
            return acc;
          }

          if (lastPort.containerPort.end + 1 === port.containerPort) {
            return [
              ...acc.slice(0, acc.length - 1),
              {
                ...lastPort,
                hostPort: undefined,
                containerPort: {
                  ...lastPort.containerPort,
                  end: port.containerPort,
                },
              } satisfies Value,
            ];
          }

          return [...acc, port];
        }

        if (typeof lastPort.containerPort === 'number') {
          if (lastPort.containerPort === port.containerPort) {
            return acc;
          }

          if (lastPort.containerPort + 1 === port.containerPort) {
            return [
              ...acc.slice(0, acc.length - 1),
              {
                ...lastPort,
                hostPort: undefined,
                containerPort: {
                  start: lastPort.containerPort,
                  end: port.containerPort,
                },
              } satisfies Value,
            ];
          }

          return [...acc, port];
        }
      }

      if (
        typeof lastPort.hostPort === 'number' &&
        typeof lastPort.containerPort === 'number'
      ) {
        if (
          lastPort.hostPort === port.hostPort &&
          lastPort.containerPort === port.containerPort
        ) {
          return acc;
        }

        if (
          lastPort.hostPort + 1 === port.hostPort &&
          lastPort.containerPort === port.containerPort
        ) {
          return [
            ...acc.slice(0, acc.length - 1),
            {
              ...lastPort,
              hostPort: {
                start: lastPort.hostPort,
                end: port.hostPort,
              },
            } satisfies Value,
          ];
        }

        if (
          lastPort.hostPort + 1 === port.hostPort &&
          lastPort.containerPort + 1 === port.containerPort
        ) {
          return [
            ...acc.slice(0, acc.length - 1),
            {
              ...lastPort,
              hostPort: {
                start: lastPort.hostPort,
                end: port.hostPort,
              },
              containerPort: {
                start: lastPort.containerPort,
                end: port.containerPort,
              },
            } satisfies Value,
          ];
        }

        return [...acc, port];
      }

      if (
        isRange(lastPort.hostPort) &&
        typeof lastPort.containerPort === 'number'
      ) {
        if (
          lastPort.hostPort.end === port.hostPort &&
          lastPort.containerPort === port.containerPort
        ) {
          return acc;
        }

        if (
          lastPort.hostPort.end + 1 === port.hostPort &&
          lastPort.containerPort === port.containerPort
        ) {
          return [
            ...acc.slice(0, acc.length - 1),
            {
              ...lastPort,
              hostPort: {
                ...lastPort.hostPort,
                end: port.hostPort,
              },
            } satisfies Value,
          ];
        }

        if (
          lastPort.hostPort.end + 1 === port.hostPort &&
          lastPort.containerPort + 1 === port.containerPort
        ) {
          return [
            ...acc.slice(0, acc.length - 1),
            {
              ...lastPort,
              hostPort: {
                ...lastPort.hostPort,
                end: port.hostPort,
              },
              containerPort: {
                start: lastPort.containerPort,
                end: port.containerPort,
              },
            } satisfies Value,
          ];
        }

        return [...acc, port];
      }

      if (isRange(lastPort.hostPort) && isRange(lastPort.containerPort)) {
        if (
          lastPort.hostPort.end === port.hostPort &&
          lastPort.containerPort.end === port.containerPort
        ) {
          return acc;
        }

        if (
          lastPort.hostPort.end + 1 === port.hostPort &&
          lastPort.containerPort.end === port.containerPort
        ) {
          return [
            ...acc.slice(0, acc.length - 1),
            {
              ...lastPort,
              hostPort: {
                ...lastPort.hostPort,
                end: port.hostPort,
              },
            } satisfies Value,
          ];
        }

        if (
          lastPort.hostPort.end + 1 === port.hostPort &&
          lastPort.containerPort.end + 1 === port.containerPort
        ) {
          return [
            ...acc.slice(0, acc.length - 1),
            {
              ...lastPort,
              hostPort: {
                ...lastPort.hostPort,
                end: port.hostPort,
              },
              containerPort: {
                ...lastPort.containerPort,
                end: port.containerPort,
              },
            } satisfies Value,
          ];
        }

        return [...acc, port];
      }

      return [...acc, port];
    }, [] as Array<Value>);
  }
}
