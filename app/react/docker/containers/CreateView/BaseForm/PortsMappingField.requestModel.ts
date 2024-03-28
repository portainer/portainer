import { PortMap } from 'docker-types/generated/1.41';
import _ from 'lodash';

import { PortMapping, Protocol, Values } from './PortsMappingField';
import { Range } from './PortsMappingField.viewModel';

type PortKey = `${string}/${Protocol}`;

export function parsePortBindingRequest(portBindings: Values): PortMap {
  const bindings: Record<
    PortKey,
    Array<{ HostIp?: string; HostPort?: string }>
  > = {};
  _.forEach(portBindings, (portBinding) => {
    if (!portBinding.containerPort) {
      return;
    }

    const portInfo = extractPortInfo(portBinding);

    let { hostPort } = portBinding;
    const { endHostPort, endPort, hostIp, startHostPort, startPort } = portInfo;
    _.range(startPort, endPort + 1).forEach((containerPort) => {
      const bindKey: PortKey = `${containerPort}/${portBinding.protocol}`;
      if (!bindings[bindKey]) {
        bindings[bindKey] = [];
      }

      if (startHostPort > 0) {
        hostPort = (startHostPort + containerPort - startPort).toString();
      }
      if (startPort === endPort && startHostPort !== endHostPort) {
        hostPort += `-${endHostPort.toString()}`;
      }

      bindings[bindKey].push(
        hostIp || hostPort ? { HostIp: hostIp, HostPort: hostPort } : {}
      );
    });
  });
  return bindings;
}

function isValidPortRange(portRange: Range) {
  return portRange.start > 0 && portRange.end >= portRange.start;
}

function parsePortRange(portRange: string | number): Range {
  // Make sure we have a string
  const portRangeString = portRange.toString();

  // Split the range and convert to integers
  const stringPorts = _.split(portRangeString, '-', 2);
  const intPorts = _.map(stringPorts, parsePort);

  return {
    start: intPorts[0],
    end: intPorts[1] || intPorts[0],
  };
}

const portPattern =
  /^([1-9]|[1-5]?[0-9]{2,4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/m;

function parsePort(port: string) {
  if (portPattern.test(port)) {
    return parseInt(port, 10);
  }

  return 0;
}

function extractPortInfo(portBinding: PortMapping): {
  startPort: number;
  endPort: number;
  hostIp: string;
  startHostPort: number;
  endHostPort: number;
} {
  const containerPortRange = parsePortRange(portBinding.containerPort);
  if (!isValidPortRange(containerPortRange)) {
    throw new Error(`Invalid port specification: ${portBinding.containerPort}`);
  }

  const startPort = containerPortRange.start;
  const endPort = containerPortRange.end;
  let hostIp = '';
  let { hostPort } = portBinding;
  if (!hostPort) {
    return {
      startPort,
      endPort,
      hostIp: '',
      startHostPort: 0,
      endHostPort: 0,
    };
  }

  if (hostPort.includes('[')) {
    const hostAndPort = _.split(hostPort, ']:');

    if (hostAndPort.length < 2) {
      throw new Error(
        `Invalid port specification: ${portBinding.containerPort}`
      );
    }

    hostIp = hostAndPort[0].replace('[', '');
    [, hostPort] = hostAndPort;
  } else if (hostPort.includes(':')) {
    [hostIp, hostPort] = _.split(hostPort, ':');
  }

  const hostPortRange = parsePortRange(hostPort);
  if (!isValidPortRange(hostPortRange)) {
    throw new Error(`Invalid port specification: ${hostPort}`);
  }

  const { start: startHostPort, end: endHostPort } = hostPortRange;
  if (
    endPort !== startPort &&
    endPort - startPort !== endHostPort - startHostPort
  ) {
    throw new Error(`Invalid port specification: ${hostPort}`);
  }

  return { startPort, endPort, hostIp, startHostPort, endHostPort };
}
